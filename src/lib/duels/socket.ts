'use client'

import { supabase } from '@/lib/supabase'
import { supabaseUrl } from '@/lib/supabase/env'

export type DuelSocketStatus = 'connecting' | 'open' | 'reconnecting' | 'closed'

type TopicListener = {
    onEvent: (event: { seq: number; event: string; payload: Record<string, unknown> }) => void
    onPresence: (online: string[], serverNow: string | null) => void
    onStatus?: (status: DuelSocketStatus) => void
    onClock?: (serverNow: string) => void
}

type Waiter = {
    resolve: () => void
    reject: (error: Error) => void
}

const READY_TIMEOUT_MS = 8_000

function socketUrl() {
    return `${supabaseUrl().replace(/^http/, 'ws')}/functions/v1/duel-ws`
}

class DuelSocketHub {
    private ws: WebSocket | null = null
    private pending: Promise<void> | null = null
    private status: DuelSocketStatus = 'closed'
    private attempt = 0
    private stopped = false
    private retryTimer = 0
    private pingTimer = 0
    token = ''
    private topics = new Map<string, Set<TopicListener>>()
    private lastSeq = new Map<string, number>()
    private acked = new Set<string>()
    private waiters = new Map<string, Waiter[]>()

    isOpen() {
        return this.ws?.readyState === WebSocket.OPEN
    }

    subscribe(topic: string, listener: TopicListener) {
        this.stopped = false
        let listeners = this.topics.get(topic)
        if (!listeners) {
            listeners = new Set()
            this.topics.set(topic, listeners)
        }
        listeners.add(listener)
        listener.onStatus?.(this.status)
        if (this.isOpen()) {
            if (this.acked.has(topic)) listener.onStatus?.('open')
            else this.sendSubscribe(topic)
        } else {
            this.setStatus(this.attempt > 0 ? 'reconnecting' : 'connecting')
            void this.connect().catch(() => {
                this.setStatus('reconnecting')
                this.scheduleRetry()
            })
        }
        return () => {
            listeners?.delete(listener)
            if (listeners && listeners.size > 0) return
            this.topics.delete(topic)
            this.acked.delete(topic)
            if (this.isOpen()) this.send({ type: 'unsubscribe', topic })
            if (!this.wantConnection()) this.ws?.close()
        }
    }

    whenReady(topic: string) {
        if (this.acked.has(topic)) return Promise.resolve()
        return new Promise<void>((resolve, reject) => {
            const waiter: Waiter = { resolve, reject }
            const list = this.waiters.get(topic) ?? []
            list.push(waiter)
            this.waiters.set(topic, list)
            window.setTimeout(() => {
                if (!list.includes(waiter)) return
                this.rejectWaiter(topic, waiter, new Error('Duel connection timed out'))
            }, READY_TIMEOUT_MS)
        })
    }

    swap() {
        if (!this.wantConnection()) return
        this.pending = this.openSocket()
            .catch(() => {
                if (!this.isOpen()) {
                    this.setStatus('reconnecting')
                    this.scheduleRetry()
                }
            })
            .finally(() => {
                this.pending = null
            })
    }

    stop() {
        this.stopped = true
        this.topics.clear()
        this.acked.clear()
        window.clearTimeout(this.retryTimer)
        this.retryTimer = 0
        this.stopPing()
        this.ws?.close()
        this.ws = null
        this.setStatus('closed')
    }

    private wantConnection() {
        return !this.stopped && this.topics.size > 0
    }

    private connect() {
        if (this.isOpen()) return Promise.resolve()
        if (!this.pending) {
            this.pending = this.openSocket().finally(() => {
                this.pending = null
            })
        }
        return this.pending
    }

    private async openSocket() {
        const { data } = await supabase.auth.getSession()
        const token = data.session?.access_token
        if (!token) throw new Error('Missing duel session')
        this.token = token
        const ws = new WebSocket(socketUrl(), [`jwt-${token}`])
        await new Promise<void>((resolve, reject) => {
            const timer = window.setTimeout(() => reject(new Error('Duel socket timed out')), READY_TIMEOUT_MS)
            ws.addEventListener(
                'open',
                () => {
                    window.clearTimeout(timer)
                    resolve()
                },
                { once: true },
            )
            ws.addEventListener(
                'error',
                () => {
                    window.clearTimeout(timer)
                    reject(new Error('Duel socket failed'))
                },
                { once: true },
            )
        })
        if (!this.wantConnection()) {
            ws.close()
            return
        }
        const previous = this.ws
        this.ws = ws
        this.bind(ws)
        this.attempt = 0
        this.acked.clear()
        this.setStatus('open')
        this.flush()
        this.startPing()
        if (previous && previous !== ws) previous.close()
    }

    private bind(ws: WebSocket) {
        ws.onmessage = (event) => {
            if (this.ws !== ws || typeof event.data !== 'string') return
            this.onMessage(event.data)
        }
        ws.onclose = () => {
            if (this.ws !== ws) return
            this.ws = null
            this.stopPing()
            this.acked.clear()
            if (!this.wantConnection()) {
                this.setStatus('closed')
                return
            }
            this.setStatus('reconnecting')
            this.scheduleRetry()
        }
        ws.onerror = () => undefined
    }

    private flush() {
        for (const topic of this.topics.keys()) this.sendSubscribe(topic)
    }

    private sendSubscribe(topic: string) {
        this.send({ type: 'subscribe', topic, since: this.lastSeq.get(topic) ?? 0 })
    }

    private send(message: Record<string, unknown>) {
        if (!this.isOpen()) return
        this.ws?.send(JSON.stringify(message))
    }

    private onMessage(raw: string) {
        let message: {
            type?: string
            seq?: number
            topic?: string
            event?: string
            payload?: Record<string, unknown>
            online?: string[]
            server_now?: string
            error?: string
        }
        try {
            message = JSON.parse(raw) as typeof message
        } catch {
            return
        }
        if (message.type === 'reconnect') {
            this.swap()
            return
        }
        if (message.type === 'pong') {
            this.noteClock(message.server_now)
            return
        }
        const topic = message.topic
        if (!topic) return
        if (message.type === 'subscribed') {
            this.acked.add(topic)
            this.settle(topic)
            return
        }
        if (message.type === 'error') {
            this.settle(topic, new Error(message.error || 'Duel channel rejected'))
            return
        }
        if (message.type === 'presence') {
            this.noteClock(message.server_now)
            const online = Array.isArray(message.online) ? message.online.map(String) : []
            for (const listener of this.topics.get(topic) ?? []) {
                listener.onPresence(online, message.server_now ?? null)
            }
            return
        }
        if (message.type !== 'event' || !message.event) return
        const seq = Number(message.seq ?? 0)
        const seen = this.lastSeq.get(topic) ?? 0
        if (seq <= seen) return
        this.lastSeq.set(topic, seq)
        const payload = message.payload ?? {}
        if (typeof payload.server_now === 'string') this.noteClock(payload.server_now)
        for (const listener of this.topics.get(topic) ?? []) {
            listener.onEvent({ seq, event: message.event, payload })
        }
    }

    private noteClock(serverNow: string | undefined) {
        if (!serverNow) return
        for (const listeners of this.topics.values()) {
            for (const listener of listeners) listener.onClock?.(serverNow)
        }
    }

    private settle(topic: string, error?: Error) {
        const waiters = this.waiters.get(topic) ?? []
        this.waiters.delete(topic)
        for (const waiter of waiters) {
            if (error) waiter.reject(error)
            else waiter.resolve()
        }
    }

    private rejectWaiter(topic: string, waiter: Waiter, error: Error) {
        const list = this.waiters.get(topic)
        if (!list) return
        const next = list.filter((item) => item !== waiter)
        if (next.length === 0) this.waiters.delete(topic)
        else this.waiters.set(topic, next)
        waiter.reject(error)
    }

    private setStatus(status: DuelSocketStatus) {
        this.status = status
        for (const listeners of this.topics.values()) {
            for (const listener of listeners) listener.onStatus?.(status)
        }
    }

    private scheduleRetry() {
        if (this.retryTimer || !this.wantConnection()) return
        const delay = Math.min(5000, 250 * 2 ** this.attempt) + Math.floor(Math.random() * 200)
        this.attempt += 1
        this.retryTimer = window.setTimeout(() => {
            this.retryTimer = 0
            if (!this.wantConnection() || this.isOpen()) return
            void this.connect().catch(() => {
                this.setStatus('reconnecting')
                this.scheduleRetry()
            })
        }, delay)
    }

    private startPing() {
        this.stopPing()
        this.pingTimer = window.setInterval(() => this.send({ type: 'ping' }), 4_000)
    }

    private stopPing() {
        window.clearInterval(this.pingTimer)
        this.pingTimer = 0
    }
}

const hub = new DuelSocketHub()

if (typeof window !== 'undefined') {
    supabase.auth.onAuthStateChange((event, session) => {
        const next = session?.access_token ?? ''
        if (event === 'SIGNED_OUT') {
            hub.stop()
            return
        }
        if (!next) return
        const changed = next !== hub.token
        hub.token = next
        if (changed && event === 'TOKEN_REFRESHED' && hub.isOpen()) hub.swap()
    })
}

export function subscribeDuelTopic(topic: string, listener: TopicListener) {
    return hub.subscribe(topic, listener)
}

export function whenDuelTopicReady(topic: string) {
    return hub.whenReady(topic)
}
