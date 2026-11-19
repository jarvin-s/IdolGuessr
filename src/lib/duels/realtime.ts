import { supabase } from '@/lib/supabase'
import type { DuelLobby, DuelMatchEvent } from '@/lib/duels/types'
import type { RealtimeChannel } from '@supabase/supabase-js'

let authPromise: Promise<void> | null = null

export function ensureRealtimeAuth(): Promise<void> {
    if (!authPromise) {
        authPromise = supabase.realtime.setAuth().then(() => undefined).catch((error) => {
            authPromise = null
            throw error
        })
    }
    return authPromise
}

function onStatus(channel: RealtimeChannel, onChange?: (status: string) => void) {
    return (status: string) => {
        onChange?.(status)
        if (status === 'SUBSCRIBED') {
            void channel.track({ online_at: Date.now() })
        }
    }
}

export function subscribeDuelUser(
    userId: string,
    handlers: {
        onMatchFound: (matchId: string) => void
        onKicked: (lobbyId: string) => void
        onStatus?: (status: string) => void
    }
): () => void {
    const channel = supabase.channel(`duel-user:${userId}`, {
        config: { private: true },
    })
    channel
        .on('broadcast', { event: 'match_found' }, ({ payload }) => {
            if (payload?.match_id) handlers.onMatchFound(String(payload.match_id))
        })
        .on('broadcast', { event: 'kicked' }, ({ payload }) => {
            if (payload?.lobby_id) handlers.onKicked(String(payload.lobby_id))
        })
        .subscribe((status) => handlers.onStatus?.(status))
    return () => {
        void supabase.removeChannel(channel)
    }
}

export function subscribeDuelLobby(
    lobbyId: string,
    userId: string,
    handlers: {
        onLobby: (lobby: DuelLobby) => void
        onMatchStarted: (matchId: string) => void
        onPresence: (onlineIds: string[]) => void
        onStatus?: (status: string) => void
    }
): () => void {
    const channel = supabase.channel(`duel-lobby:${lobbyId}`, {
        config: { private: true, presence: { key: userId } },
    })
    channel
        .on('broadcast', { event: 'lobby_updated' }, ({ payload }) => {
            if (payload?.lobby) handlers.onLobby(payload.lobby as DuelLobby)
        })
        .on('broadcast', { event: 'match_started' }, ({ payload }) => {
            if (payload?.match_id) handlers.onMatchStarted(String(payload.match_id))
        })
        .on('presence', { event: 'sync' }, () => {
            handlers.onPresence(Object.keys(channel.presenceState()))
        })
        .subscribe(onStatus(channel, handlers.onStatus))
    return () => {
        void supabase.removeChannel(channel)
    }
}

export function subscribeDuelMatch(
    matchId: string,
    userId: string,
    handlers: {
        onEvent: (event: DuelMatchEvent) => void
        onPresence: (onlineIds: string[]) => void
        onStatus?: (status: string) => void
    }
): () => void {
    const channel = supabase.channel(`duel:${matchId}`, {
        config: { private: true, presence: { key: userId } },
    })
    channel
        .on('broadcast', { event: 'player_guessed' }, ({ payload }) => {
            handlers.onEvent({ type: 'player_guessed', ...payload })
        })
        .on('broadcast', { event: 'round_resolved' }, ({ payload }) => {
            handlers.onEvent({ type: 'round_resolved', ...payload })
        })
        .on('broadcast', { event: 'match_finished' }, ({ payload }) => {
            handlers.onEvent({ type: 'match_finished', ...payload })
        })
        .on('broadcast', { event: 'player_left' }, ({ payload }) => {
            handlers.onEvent({ type: 'player_left', ...payload })
        })
        .on('presence', { event: 'sync' }, () => {
            handlers.onPresence(Object.keys(channel.presenceState()))
        })
        .subscribe(onStatus(channel, handlers.onStatus))
    return () => {
        void supabase.removeChannel(channel)
    }
}
