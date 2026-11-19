'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import DuelGuessInput from '@/components/duels/DuelGuessInput'
import DuelHud from '@/components/duels/DuelHud'
import DuelResultModal from '@/components/duels/DuelResultModal'
import DuelRoundImage from '@/components/duels/DuelRoundImage'
import GuessFeed from '@/components/duels/GuessFeed'
import MatchCountdown from '@/components/duels/MatchCountdown'
import RoundResultOverlay from '@/components/duels/RoundResultOverlay'
import { ROUND_SECONDS } from '@/lib/duels/constants'
import { duelRematchKey } from '@/hooks/useDuelLobby'
import { useDuelMatch } from '@/hooks/useDuelMatch'

export default function DuelMatchPage() {
    const params = useParams()
    const router = useRouter()
    const { profile } = useAuth()
    const matchId = String(params.id ?? '')
    const match = useDuelMatch(matchId)
    const [confirmLeave, setConfirmLeave] = useState(false)
    const [rematchCode, setRematchCode] = useState<string | null>(null)
    const selfId = profile?.id ?? ''

    useEffect(() => {
        setRematchCode(window.sessionStorage.getItem(duelRematchKey(matchId)))
    }, [matchId])

    useEffect(() => {
        if (match.phase === 'loading' || match.phase === 'finished') return
        const onLeave = (event: BeforeUnloadEvent) => {
            event.preventDefault()
            event.returnValue = ''
        }
        window.addEventListener('beforeunload', onLeave)
        return () => window.removeEventListener('beforeunload', onLeave)
    }, [match.phase])

    const state = match.state
    if (match.error && !state) {
        return (
            <main className='px-4 py-16 text-center'>
                <p>{match.error}</p>
                <button type='button' className='mt-4 underline' onClick={() => router.push('/duels')}>
                    Back to Duels
                </button>
            </main>
        )
    }
    if (!state) {
        return <main className='px-4 py-16 text-center text-sm text-zinc-500'>Loading duel…</main>
    }

    const round = state.current_round
    const showOverlay = match.phase === 'intermission' && !!state.last_result
    const showResult = match.phase === 'finished'
    const idol = showOverlay ? match.overlayIdol ?? round?.idol : round?.idol
    const playing = match.phase === 'playing' || match.phase === 'resolving'
    const showCountdown = match.phase === 'countdown'

    return (
        <main className='relative mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-4 py-4'>
            <button
                type='button'
                onClick={() => setConfirmLeave(true)}
                className='absolute top-3 right-3 z-10 cursor-pointer text-xs underline'
            >
                Forfeit
            </button>
            <DuelHud
                players={state.players}
                myTeam={state.my_team}
                teamHp={state.team_hp}
                secondsLeft={playing ? match.secondsLeft : ROUND_SECONDS}
                multiplier={round?.multiplier ?? 1}
                roundNo={round?.round_no ?? state.last_result?.round_no ?? 1}
                onlineIds={match.onlineIds}
                correctIds={round?.correct_players ?? []}
                doneIds={round?.players_done ?? []}
                pressured={match.pressured}
                shakeTeam={showOverlay ? state.last_result?.damaged_team ?? null : null}
            />
            <div className='relative mx-auto w-full max-w-md flex-1'>
                {idol && (playing || showOverlay) ? (
                    <DuelRoundImage
                        idol={idol}
                        difficulty={state.config.difficulty}
                        imageMode={state.config.image_mode}
                        step={match.revealStep}
                        revealed={match.phase === 'resolving' || showOverlay}
                    />
                ) : (
                    <div className='aspect-square w-full rounded-lg bg-zinc-200 dark:bg-zinc-800' />
                )}
                {showCountdown ? (
                    <MatchCountdown secondsToStart={match.phase === 'countdown' ? match.secondsLeft : 0} />
                ) : null}
                <GuessFeed items={match.feed} />
                {showOverlay && state.last_result ? (
                    <RoundResultOverlay
                        result={state.last_result}
                        players={state.players}
                        myTeam={state.my_team}
                        idol={match.overlayIdol}
                        imageMode={state.config.image_mode}
                        difficulty={state.config.difficulty}
                    />
                ) : null}
                {showResult ? (
                    <DuelResultModal
                        winnerTeam={state.winner_team}
                        myTeam={state.my_team}
                        players={state.players}
                        teamHp={state.team_hp}
                        abandoned={state.status === 'abandoned'}
                        onRematch={rematchCode ? () => router.push(`/duels/${rematchCode}`) : undefined}
                        onHome={() => router.push('/duels')}
                    />
                ) : null}
            </div>
            {round && !showResult ? (
                <DuelGuessInput
                    onSubmit={async (guess) => {
                        const result = await match.submitGuess(guess)
                        return result ? { correct: result.correct } : undefined
                    }}
                    disabled={match.phase !== 'playing'}
                    guessesLeft={Math.max(0, round.max_guesses - round.my_guesses.length)}
                    maxGuesses={round.max_guesses}
                    done={round.my_done}
                    correct={round.correct_players.includes(selfId)}
                    used={round.my_guesses.length}
                />
            ) : null}
            {match.error ? <p className='text-center text-sm text-red-500'>{match.error}</p> : null}
            {confirmLeave ? (
                <div className='absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
                    <div className='w-full max-w-xs rounded-md bg-white p-4 text-center dark:bg-zinc-900'>
                        <p className='font-medium'>Leave this duel?</p>
                        <p className='mt-1 text-sm text-zinc-500'>If your whole team leaves, the other team wins.</p>
                        <div className='mt-4 flex justify-center gap-2'>
                            <button
                                type='button'
                                className='cursor-pointer rounded-full border px-3 py-1'
                                onClick={() => setConfirmLeave(false)}
                            >
                                Stay
                            </button>
                            <button
                                type='button'
                                className='cursor-pointer rounded-full bg-red-500 px-3 py-1 text-white'
                                onClick={() => {
                                    setConfirmLeave(false)
                                    void match.forfeit()
                                }}
                            >
                                Forfeit
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </main>
    )
}
