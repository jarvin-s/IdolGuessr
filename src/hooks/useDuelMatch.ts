'use client'

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import {
    forfeitDuel,
    getDuelState,
    resolveDuelRound,
    submitDuelGuess,
} from '@/lib/duels/api'
import { COUNTDOWN_SECONDS, ROUND_SECONDS } from '@/lib/duels/constants'
import { duelErrorCode, duelErrorMessage } from '@/lib/duels/errors'
import { ensureRealtimeAuth, subscribeDuelMatch } from '@/lib/duels/realtime'
import type {
    DuelGuessResult,
    DuelMatchEvent,
    DuelPublicIdol,
    DuelState,
    GuessFeedItem,
} from '@/lib/duels/types'
import { useServerClock } from '@/hooks/useServerClock'

export type DuelPhase = 'loading' | 'countdown' | 'playing' | 'resolving' | 'intermission' | 'finished'

interface Model {
    duel: DuelState | null
    feed: GuessFeedItem[]
    onlineIds: string[]
    error: string | null
    overlayIdol: DuelPublicIdol | null
}

type Action =
    | { type: 'snapshot'; duel: DuelState; keepOverlay?: boolean }
    | { type: 'event'; event: DuelMatchEvent; selfId: string }
    | { type: 'guess_result'; guess: string; result: DuelGuessResult; selfId: string }
    | { type: 'presence'; ids: string[] }
    | { type: 'error'; error: string | null }

function feedId(userId: string, roundNo: number, guessCount: number) {
    return `${userId}:${roundNo}:${guessCount}`
}

function playerName(duel: DuelState | null, userId: string) {
    return duel?.players.find((player) => player.user_id === userId)?.nickname ?? 'Player'
}

function pushFeed(feed: GuessFeedItem[], item: GuessFeedItem) {
    if (feed.some((entry) => entry.id === item.id)) return feed
    return [...feed, item].slice(-20)
}

function withGuess(duel: DuelState, selfId: string, guess: string, result: DuelGuessResult): DuelState {
    const round = duel.current_round
    if (!round || round.round_no !== (result.resolved_state?.last_result?.round_no ?? round.round_no)) {
        if (result.resolved_state) return result.resolved_state
    }
    if (!round) return result.resolved_state ?? duel
    const guesses = round.my_guesses.includes(guess) ? round.my_guesses : [...round.my_guesses, guess]
    const correctPlayers = result.correct
        ? [...new Set([...round.correct_players, selfId])]
        : round.correct_players
    const playersDone = result.done ? [...new Set([...round.players_done, selfId])] : round.players_done
    return {
        ...duel,
        current_round: {
            ...round,
            my_guesses: guesses,
            my_done: result.done,
            deadline: result.deadline,
            correct_players: correctPlayers,
            players_done: playersDone,
        },
    }
}

function reduce(model: Model, action: Action): Model {
    if (action.type === 'error') return { ...model, error: action.error }
    if (action.type === 'presence') return { ...model, onlineIds: action.ids }
    if (action.type === 'snapshot') {
        return {
            ...model,
            duel: action.duel,
            error: null,
            overlayIdol: action.keepOverlay ? model.overlayIdol : model.overlayIdol,
        }
    }
    if (action.type === 'guess_result') {
        const duel = model.duel
        if (!duel) return model
        if (action.result.resolved_state) {
            const resolved = action.result.resolved_state
            const finishedNo = resolved.last_result?.round_no
            const current = duel.current_round
            const overlay =
                current && (finishedNo == null || current.round_no === finishedNo)
                    ? current.idol
                    : model.overlayIdol ?? current?.idol ?? null
            return {
                ...model,
                duel: resolved,
                overlayIdol: overlay,
                error: null,
            }
        }
        const count = (duel.current_round?.my_guesses.length ?? 0) + 1
        const text = action.result.correct
            ? `${playerName(duel, action.selfId)} got it`
            : `${playerName(duel, action.selfId)} guessed wrong (${count}/${duel.current_round?.max_guesses ?? count})`
        return {
            ...model,
            duel: withGuess(duel, action.selfId, action.guess, action.result),
            feed: pushFeed(model.feed, {
                id: feedId(action.selfId, duel.current_round?.round_no ?? 0, count),
                userId: action.selfId,
                text,
            }),
            error: null,
        }
    }

    const event = action.event
    const duel = model.duel
    if (!duel) return model
    if (event.type === 'player_guessed') {
        const round = duel.current_round
        const max = round?.max_guesses ?? 6
        const text = event.correct
            ? `${playerName(duel, event.user_id)} got it${event.seconds == null ? '' : ` in ${event.seconds}s`}`
            : `${playerName(duel, event.user_id)} guessed wrong (${event.guess_count}/${max})`
        const nextRound = round && round.round_no === event.round_no
            ? {
                  ...round,
                  deadline: event.deadline,
                  players_done: event.done
                      ? [...new Set([...round.players_done, event.user_id])]
                      : round.players_done,
                  correct_players: event.correct
                      ? [...new Set([...round.correct_players, event.user_id])]
                      : round.correct_players,
              }
            : round
        return {
            ...model,
            duel: { ...duel, current_round: nextRound },
            feed: pushFeed(model.feed, {
                id: feedId(event.user_id, event.round_no, event.guess_count),
                userId: event.user_id,
                text,
            }),
        }
    }
    if (event.type === 'round_resolved') {
        const nextNo = event.next_round?.round_no
        const current = duel.current_round
        const alreadyAdvanced = current?.round_no === nextNo
        return {
            ...model,
            overlayIdol: alreadyAdvanced
                ? model.overlayIdol
                : current?.idol ?? model.overlayIdol,
            duel: {
                ...duel,
                team_hp: event.result.team_hp,
                last_result: event.result,
                current_round: event.next_round,
            },
        }
    }
    if (event.type === 'match_finished') {
        return {
            ...model,
            duel: {
                ...duel,
                status: 'finished',
                winner_team: event.winner_team,
                team_hp: event.team_hp,
                current_round: null,
            },
        }
    }
    return {
        ...model,
        duel: {
            ...duel,
            players: duel.players.map((player) =>
                player.user_id === event.user_id ? { ...player, left: true } : player
            ),
        },
    }
}

function initial(): Model {
    return { duel: null, feed: [], onlineIds: [], error: null, overlayIdol: null }
}

export function useDuelMatch(matchId: string) {
    const { profile, ready } = useAuth()
    const { now, sync } = useServerClock()
    const [model, dispatch] = useReducer(reduce, undefined, initial)
    const [tick, setTick] = useState(0)
    const modelRef = useRef(model)
    modelRef.current = model
    const syncRef = useRef(sync)
    syncRef.current = sync
    const nowRef = useRef(now)
    nowRef.current = now
    const resolveKey = useRef('')
    const selfId = profile?.id ?? ''

    const applySnapshot = useCallback((duel: DuelState) => {
        syncRef.current(duel.server_now)
        dispatch({ type: 'snapshot', duel })
    }, [])

    useEffect(() => {
        if (!ready || !selfId || !matchId) return
        let cancelled = false
        let unsubscribe = () => {}
        let status = ''
        const load = async (resubscribe: boolean) => {
            const duel = await getDuelState(matchId)
            if (cancelled) return
            applySnapshot(duel)
            if (!resubscribe) return
            await ensureRealtimeAuth()
            if (cancelled) return
            unsubscribe = subscribeDuelMatch(matchId, selfId, {
                onEvent: (event) => {
                    if ('server_now' in event && event.server_now) syncRef.current(event.server_now)
                    dispatch({ type: 'event', event, selfId })
                },
                onPresence: (ids) => dispatch({ type: 'presence', ids }),
                onStatus: (next) => {
                    const previous = status
                    status = next
                    if (
                        next === 'SUBSCRIBED' &&
                        (previous === 'CHANNEL_ERROR' || previous === 'TIMED_OUT')
                    ) {
                        void getDuelState(matchId).then(applySnapshot).catch(() => undefined)
                    }
                },
            })
        }
        void load(true).catch((error) => {
            if (!cancelled) dispatch({ type: 'error', error: duelErrorMessage(error) })
        })
        return () => {
            cancelled = true
            unsubscribe()
        }
    }, [ready, selfId, matchId, applySnapshot])

    useEffect(() => {
        const timer = window.setInterval(() => {
            const nowMs = nowRef.current()
            setTick(nowMs)
            const duel = modelRef.current.duel
            const round = duel?.current_round
            if (!duel || duel.status !== 'active' || !round) return
            if (nowMs < Date.parse(round.deadline)) return
            const key = `${round.round_no}:${round.deadline}`
            if (resolveKey.current === key) return
            resolveKey.current = key
            window.setTimeout(() => {
                void resolveDuelRound(matchId, round.round_no)
                    .then(applySnapshot)
                    .catch((error) => {
                        if (duelErrorCode(error) !== 'round_not_active') return
                        resolveKey.current = ''
                        void getDuelState(matchId).then(applySnapshot).catch(() => undefined)
                    })
            }, Math.random() * 400)
        }, 100)
        return () => window.clearInterval(timer)
    }, [matchId, applySnapshot])

    const derived = useMemo(() => {
        const duel = model.duel
        const round = duel?.current_round
        if (!duel) {
            return { phase: 'loading' as DuelPhase, secondsLeft: 0, pressured: false }
        }
        if (duel.status !== 'active' || !round) {
            return { phase: 'finished' as DuelPhase, secondsLeft: 0, pressured: false }
        }
        const starts = Date.parse(round.starts_at)
        const deadline = Date.parse(round.deadline)
        const countdownAt = starts - COUNTDOWN_SECONDS * 1000
        const fullDeadline = starts + ROUND_SECONDS * 1000
        const pressured = deadline < fullDeadline - 250
        if (tick < countdownAt && duel.last_result) {
            return {
                phase: 'intermission' as DuelPhase,
                secondsLeft: Math.max(0, (countdownAt - tick) / 1000),
                pressured,
            }
        }
        if (tick < starts) {
            return {
                phase: 'countdown' as DuelPhase,
                secondsLeft: Math.max(0, (starts - tick) / 1000),
                pressured,
            }
        }
        if (tick < deadline) {
            return {
                phase: 'playing' as DuelPhase,
                secondsLeft: Math.max(0, (deadline - tick) / 1000),
                pressured,
            }
        }
        return {
            phase: 'resolving' as DuelPhase,
            secondsLeft: 0,
            pressured,
        }
    }, [model.duel, tick])

    const submitGuess = useCallback(
        async (guess: string) => {
            const round = modelRef.current.duel?.current_round
            if (!round || !selfId) return
            try {
                const result = await submitDuelGuess(matchId, round.round_no, guess)
                if (result.resolved_state?.server_now) syncRef.current(result.resolved_state.server_now)
                dispatch({ type: 'guess_result', guess, result, selfId })
                return result
            } catch (error) {
                dispatch({ type: 'error', error: duelErrorMessage(error) })
                throw error
            }
        },
        [matchId, selfId]
    )

    const forfeit = useCallback(async () => {
        try {
            const duel = await forfeitDuel(matchId)
            applySnapshot(duel)
        } catch (error) {
            dispatch({ type: 'error', error: duelErrorMessage(error) })
        }
    }, [matchId, applySnapshot])

    return {
        state: model.duel,
        phase: derived.phase,
        secondsLeft: derived.secondsLeft,
        pressured: derived.pressured,
        feed: model.feed,
        onlineIds: model.onlineIds,
        overlayIdol: model.overlayIdol,
        submitGuess,
        forfeit,
        error: model.error,
        ready,
    }
}
