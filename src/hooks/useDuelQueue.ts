'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { duelQueueHeartbeat, joinDuelQueue, leaveDuelQueue } from '@/lib/duels/api'
import { QUEUE_HEARTBEAT_SECONDS } from '@/lib/duels/constants'
import { duelErrorMessage } from '@/lib/duels/errors'
import { subscribeDuelUser, whenDuelSocketReady } from '@/lib/duels/realtime'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env'
import { supabase } from '@/lib/supabase'
import type { DuelConfig } from '@/lib/duels/types'

export function useDuelQueue() {
    const { profile, ready } = useAuth()
    const router = useRouter()
    const [searching, setSearching] = useState(false)
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [error, setError] = useState('')
    const [config, setConfig] = useState<DuelConfig | null>(null)
    const searchingRef = useRef(false)
    const unsubscribeRef = useRef<(() => void) | null>(null)
    const matchedRef = useRef(false)

    const stop = useCallback(() => {
        searchingRef.current = false
        setSearching(false)
        unsubscribeRef.current?.()
        unsubscribeRef.current = null
    }, [])

    const go = useCallback(
        (matchId: string) => {
            if (matchedRef.current) return
            matchedRef.current = true
            stop()
            router.push(`/duels/match/${matchId}`)
        },
        [router, stop]
    )

    const leave = useCallback(() => {
        if (matchedRef.current) return
        stop()
        void leaveDuelQueue().catch(() => undefined)
    }, [stop])

    const join = useCallback(
        async (next: DuelConfig) => {
            if (!profile?.id) return
            setError('')
            matchedRef.current = false
            setConfig(next)
            setElapsedSeconds(0)
            try {
                unsubscribeRef.current?.()
                const topic = `duel-user:${profile.id}`
                unsubscribeRef.current = subscribeDuelUser(profile.id, {
                    onMatchFound: go,
                    onKicked: () => undefined,
                })
                await whenDuelSocketReady(topic)
                const result = await joinDuelQueue(next)
                if (result.status === 'matched' && result.match_id) {
                    go(result.match_id)
                    return
                }
                searchingRef.current = true
                setSearching(true)
            } catch (err) {
                stop()
                setError(duelErrorMessage(err))
            }
        },
        [profile?.id, go, stop]
    )

    useEffect(() => {
        if (!searching) return
        const started = Date.now()
        const elapsed = window.setInterval(() => {
            setElapsedSeconds(Math.floor((Date.now() - started) / 1000))
        }, 1000)
        const beat = window.setInterval(() => {
            void duelQueueHeartbeat()
                .then((result) => {
                    if (!searchingRef.current || result.queued || matchedRef.current) return
                    stop()
                    setError('The search ended before an opponent was found.')
                })
                .catch(() => undefined)
        }, QUEUE_HEARTBEAT_SECONDS * 1000)
        return () => {
            window.clearInterval(elapsed)
            window.clearInterval(beat)
        }
    }, [searching, stop])

    useEffect(() => {
        if (!searching) return
        const onHide = () => {
            if (!searchingRef.current || matchedRef.current) return
            void supabase.auth.getSession().then(({ data }) => {
                const token = data.session?.access_token
                if (!token) return
                void fetch(`${supabaseUrl()}/rest/v1/rpc/leave_duel_queue`, {
                    method: 'POST',
                    keepalive: true,
                    headers: {
                        apikey: supabaseAnonKey(),
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: '{}',
                })
            })
        }
        window.addEventListener('pagehide', onHide)
        return () => {
            window.removeEventListener('pagehide', onHide)
            if (searchingRef.current && !matchedRef.current) {
                void leaveDuelQueue().catch(() => undefined)
            }
        }
    }, [searching])

    return { ready, searching, elapsedSeconds, config, error, join, leave }
}
