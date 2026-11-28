'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import {
    getDuelLobby,
    kickDuelMember,
    leaveDuelLobby,
    setDuelTeam,
    startDuelLobby,
    updateDuelLobby,
} from '@/lib/duels/api'
import { duelErrorMessage } from '@/lib/duels/errors'
import { subscribeDuelLobby, subscribeDuelUser } from '@/lib/duels/realtime'
import type { DuelSocketStatus } from '@/lib/duels/socket'
import type { DuelConfig, DuelFormat, DuelLobby } from '@/lib/duels/types'

export function duelRematchKey(matchId: string) {
    return `idol-guessr-duel-rematch:${matchId}`
}

function teamCounts(lobby: DuelLobby) {
    return {
        one: lobby.members.filter((member) => member.team === 1).length,
        two: lobby.members.filter((member) => member.team === 2).length,
    }
}

export function lobbyCanStart(lobby: DuelLobby) {
    const { one, two } = teamCounts(lobby)
    if (lobby.format === '1v1') return one === 1 && two === 1
    if (lobby.format === '2v2') return one === 2 && two === 2
    return (one === 1 && two === 2) || (one === 2 && two === 1)
}

export function useDuelLobby(code: string) {
    const { profile, ready } = useAuth()
    const router = useRouter()
    const [lobby, setLobby] = useState<DuelLobby | null>(null)
    const [onlineIds, setOnlineIds] = useState<string[]>([])
    const [connection, setConnection] = useState<DuelSocketStatus>('connecting')
    const [error, setError] = useState('')
    const myId = profile?.id ?? ''

    const openMatch = useCallback(
        (matchId: string, lobbyCode: string) => {
            window.sessionStorage.setItem(duelRematchKey(matchId), lobbyCode)
            router.push(`/duels/match/${matchId}`)
        },
        [router]
    )

    useEffect(() => {
        if (!ready || !myId || !code) return
        let cancelled = false
        let unsubscribe = () => {}
        let unsubscribeUser = () => {}
        let status = ''
        let lobbyId = ''

        const load = async () => {
            const snapshot = await getDuelLobby(code)
            if (cancelled) return
            setLobby(snapshot)
            lobbyId = snapshot.id
            if (snapshot.status === 'in_match' && snapshot.match_id) {
                openMatch(snapshot.match_id, snapshot.code)
                return
            }
            if (cancelled) return
            const onStatus = (next: DuelSocketStatus) => {
                const previous = status
                status = next
                setConnection(next)
                if (next === 'open' && previous === 'reconnecting') {
                    void getDuelLobby(code).then(setLobby).catch(() => undefined)
                }
            }
            unsubscribe = subscribeDuelLobby(snapshot.id, myId, {
                onLobby: setLobby,
                onMatchStarted: (matchId) => openMatch(matchId, snapshot.code),
                onPresence: setOnlineIds,
                onStatus,
            })
            unsubscribeUser = subscribeDuelUser(myId, {
                onMatchFound: () => undefined,
                onKicked: (kickedLobby) => {
                    if (kickedLobby !== lobbyId) return
                    setLobby(null)
                    setError('The host removed you from the lobby.')
                },
            })
        }

        void load().catch((err) => {
            if (!cancelled) setError(duelErrorMessage(err))
        })
        return () => {
            cancelled = true
            unsubscribe()
            unsubscribeUser()
        }
    }, [ready, myId, code, openMatch])

    const run = useCallback(async (action: () => Promise<DuelLobby>) => {
        try {
            setLobby(await action())
            setError('')
        } catch (err) {
            setError(duelErrorMessage(err))
        }
    }, [])

    const canStart = useMemo(() => (lobby ? lobbyCanStart(lobby) : false), [lobby])

    return {
        lobby,
        myId,
        isHost: !!lobby && lobby.host_id === myId,
        canStart,
        onlineIds,
        reconnecting: connection === 'reconnecting',
        error,
        ready,
        changeFormat: (format: DuelFormat) => {
            if (!lobby) return
            return run(() => updateDuelLobby(lobby.id, format, lobby.config))
        },
        changeConfig: (config: DuelConfig) => {
            if (!lobby) return
            return run(() => updateDuelLobby(lobby.id, lobby.format, config))
        },
        move: (userId: string, team: 1 | 2) => {
            if (!lobby) return
            return run(() => setDuelTeam(lobby.id, userId, team))
        },
        kick: (userId: string) => {
            if (!lobby) return
            return run(() => kickDuelMember(lobby.id, userId))
        },
        start: async () => {
            if (!lobby) return
            try {
                const { match_id: matchId } = await startDuelLobby(lobby.id)
                openMatch(matchId, lobby.code)
            } catch (err) {
                setError(duelErrorMessage(err))
            }
        },
        leave: async () => {
            if (!lobby) return
            try {
                await leaveDuelLobby(lobby.id)
                router.push('/duels')
            } catch (err) {
                setError(duelErrorMessage(err))
            }
        },
    }
}
