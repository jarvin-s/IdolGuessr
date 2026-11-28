import { subscribeDuelTopic, whenDuelTopicReady, type DuelSocketStatus } from '@/lib/duels/socket'
import type { DuelLobby, DuelMatchEvent } from '@/lib/duels/types'

type StatusHandler = (status: DuelSocketStatus) => void
type ClockHandler = (serverNow: string) => void

function payload(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

export function whenDuelSocketReady(topic: string) {
    return whenDuelTopicReady(topic)
}

export function subscribeDuelUser(
    userId: string,
    handlers: {
        onMatchFound: (matchId: string) => void
        onKicked: (lobbyId: string) => void
        onStatus?: StatusHandler
        onClock?: ClockHandler
    },
): () => void {
    return subscribeDuelTopic(`duel-user:${userId}`, {
        onStatus: handlers.onStatus,
        onClock: handlers.onClock,
        onPresence: () => undefined,
        onEvent: ({ event, payload: body }) => {
            const data = payload(body)
            if (event === 'match_found' && data.match_id) handlers.onMatchFound(String(data.match_id))
            if (event === 'kicked' && data.lobby_id) handlers.onKicked(String(data.lobby_id))
        },
    })
}

export function subscribeDuelLobby(
    lobbyId: string,
    _userId: string,
    handlers: {
        onLobby: (lobby: DuelLobby) => void
        onMatchStarted: (matchId: string) => void
        onPresence: (onlineIds: string[]) => void
        onStatus?: StatusHandler
        onClock?: ClockHandler
    },
): () => void {
    return subscribeDuelTopic(`duel-lobby:${lobbyId}`, {
        onStatus: handlers.onStatus,
        onClock: handlers.onClock,
        onPresence: (online) => handlers.onPresence(online),
        onEvent: ({ event, payload: body }) => {
            const data = payload(body)
            if (event === 'lobby_updated' && data.lobby) handlers.onLobby(data.lobby as DuelLobby)
            if (event === 'match_started' && data.match_id) handlers.onMatchStarted(String(data.match_id))
        },
    })
}

export function subscribeDuelMatch(
    matchId: string,
    _userId: string,
    handlers: {
        onEvent: (event: DuelMatchEvent) => void
        onPresence: (onlineIds: string[]) => void
        onStatus?: StatusHandler
        onClock?: ClockHandler
    },
): () => void {
    return subscribeDuelTopic(`duel:${matchId}`, {
        onStatus: handlers.onStatus,
        onClock: handlers.onClock,
        onPresence: (online) => handlers.onPresence(online),
        onEvent: ({ event, payload: body }) => {
            const data = payload(body)
            if (event === 'player_guessed') {
                handlers.onEvent({ type: 'player_guessed', ...data } as DuelMatchEvent)
            } else if (event === 'round_resolved') {
                handlers.onEvent({ type: 'round_resolved', ...data } as DuelMatchEvent)
            } else if (event === 'match_finished') {
                handlers.onEvent({ type: 'match_finished', ...data } as DuelMatchEvent)
            } else if (event === 'player_left') {
                handlers.onEvent({ type: 'player_left', ...data } as DuelMatchEvent)
            }
        },
    })
}
