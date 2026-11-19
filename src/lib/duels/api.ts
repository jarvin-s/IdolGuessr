import { supabase } from '@/lib/supabase'
import type {
    DuelConfig,
    DuelFormat,
    DuelGuessResult,
    DuelLeaderboardMe,
    DuelLeaderboardRow,
    DuelLobby,
    DuelState,
} from '@/lib/duels/types'

async function rpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
    const { data, error } = await supabase.rpc(fn, args)
    if (error) throw error
    return data as T
}

export function createDuelLobby(format: DuelFormat, config: DuelConfig) {
    return rpc<DuelLobby>('create_duel_lobby', { p_format: format, p_config: config })
}

export function joinDuelLobby(code: string) {
    return rpc<DuelLobby>('join_duel_lobby', { p_code: code })
}

export function leaveDuelLobby(lobbyId: string) {
    return rpc<DuelLobby>('leave_duel_lobby', { p_lobby: lobbyId })
}

export function updateDuelLobby(lobbyId: string, format: DuelFormat, config: DuelConfig) {
    return rpc<DuelLobby>('update_duel_lobby', {
        p_lobby: lobbyId,
        p_format: format,
        p_config: config,
    })
}

export function setDuelTeam(lobbyId: string, userId: string, team: 1 | 2) {
    return rpc<DuelLobby>('set_duel_team', {
        p_lobby: lobbyId,
        p_user: userId,
        p_team: team,
    })
}

export function kickDuelMember(lobbyId: string, userId: string) {
    return rpc<DuelLobby>('kick_duel_member', { p_lobby: lobbyId, p_user: userId })
}

export function startDuelLobby(lobbyId: string) {
    return rpc<{ match_id: string }>('start_duel_lobby', { p_lobby: lobbyId })
}

export function getDuelLobby(code: string) {
    return rpc<DuelLobby>('get_duel_lobby', { p_code: code })
}

export function joinDuelQueue(config: DuelConfig) {
    return rpc<{ status: 'queued' | 'matched'; match_id?: string }>('join_duel_queue', {
        p_config: config,
    })
}

export function duelQueueHeartbeat() {
    return rpc<{ queued: boolean }>('duel_queue_heartbeat')
}

export function leaveDuelQueue() {
    return rpc<{ queued: boolean }>('leave_duel_queue')
}

export function getDuelState(matchId: string) {
    return rpc<DuelState>('get_duel_state', { p_match: matchId })
}

export function submitDuelGuess(matchId: string, roundNo: number, guess: string) {
    return rpc<DuelGuessResult>('submit_duel_guess', {
        p_match: matchId,
        p_round: roundNo,
        p_guess: guess,
    })
}

export function resolveDuelRound(matchId: string, roundNo: number) {
    return rpc<DuelState>('resolve_duel_round', { p_match: matchId, p_round: roundNo })
}

export function forfeitDuel(matchId: string) {
    return rpc<DuelState>('forfeit_duel', { p_match: matchId })
}

export function fetchDuelLeaderboard(limit = 50, minMatches = 10) {
    return rpc<{ rows: DuelLeaderboardRow[]; me: DuelLeaderboardMe | null }>(
        'get_duel_leaderboard',
        { p_limit: limit, p_min_matches: minMatches }
    )
}
