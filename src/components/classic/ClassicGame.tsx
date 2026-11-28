'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'motion/react'
import ColorLegend, {
    ProfileSourceNote,
} from '@/components/classic/ColorLegend'
import GuessGrid from '@/components/classic/GuessGrid'
import { CLASSIC_REVEAL_MS } from '@/components/classic/GuessRow'
import ClassicFilterModal from '@/components/classic/ClassicFilterModal'
import ClassicWinModal from '@/components/classic/ClassicWinModal'
import IdolSearchInput from '@/components/classic/IdolSearchInput'
import GameHeader from '@/components/game/GameHeader'
import AccountModal from '@/components/modals/AccountModal'
import FeedbackModal from '@/components/modals/FeedbackModal'
import ClassicHelpModal from '@/components/classic/ClassicHelpModal'
import InfoModal from '@/components/modals/InfoModal'
import {
    getClassicPool,
    giveUpClassic,
    loadClassicDaily,
    startClassicRound,
    submitClassic,
    type ClassicCandidate,
    type ClassicGame as ClassicState,
    type ClassicGroup,
    type ClassicMode,
} from '@/lib/classic'
import {
    getClassicGame,
    getProfile,
    playerReady,
    savePlayerSettings,
    subscribePlayer,
} from '@/lib/player'

function friendly(error: unknown) {
    const message =
        error instanceof Error ? error.message : 'Something went wrong'
    if (message.includes('already_guessed'))
        return 'You already guessed that idol'
    if (message.includes('no_idol')) return 'No idols match this filter yet'
    if (message.includes('not_authenticated'))
        return 'Still signing you in. Try again.'
    if (message.includes('no_active_game'))
        return 'This round is already finished'
    if (message.includes('round_in_progress'))
        return 'Finish this idol before starting another'
    return message
}

function formatCountdown(ms: number) {
    const total = Math.max(0, Math.floor(ms / 1000))
    const hours = Math.floor(total / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const seconds = total % 60
    return [hours, minutes, seconds]
        .map((part) => part.toString().padStart(2, '0'))
        .join(':')
}

function filterLabel(group: ClassicGroup) {
    if (group === 'girl-group') return 'Girl groups'
    if (group === 'boy-group') return 'Boy groups'
    return 'All groups'
}

export default function ClassicGame({ mode }: { mode: ClassicMode }) {
    const router = useRouter()
    const [game, setGame] = useState<ClassicState | null>(null)
    const [pool, setPool] = useState<ClassicCandidate[]>([])
    const [loading, setLoading] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [newestId, setNewestId] = useState<number | null>(null)
    const [endAt, setEndAt] = useState<string | null>(null)
    const [winCount, setWinCount] = useState<number | null>(null)
    const [serverOffset, setServerOffset] = useState(0)
    const [now, setNow] = useState(() => Date.now())
    const [resultOpen, setResultOpen] = useState(true)
    const [playMore, setPlayMore] = useState(false)
    const [revealHold, setRevealHold] = useState(false)
    const [confirmGiveUp, setConfirmGiveUp] = useState(false)
    const [filterOpen, setFilterOpen] = useState(false)
    const [showAccount, setShowAccount] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)
    const [feedbackFromInfo, setFeedbackFromInfo] = useState(false)
    const rolled = useRef(false)
    const busyRef = useRef(false)
    const holdResult = useRef(false)
    const revealTimer = useRef<number | null>(null)

    useEffect(() => {
        const sync = () => setGame(getClassicGame(mode))
        sync()
        return subscribePlayer(sync)
    }, [mode])

    const playMoreArmed = useRef(false)

    const dismissHelp = (reopenInfo = false) => {
        setShowHelp(false)
        if (reopenInfo) setShowInfo(true)
        void savePlayerSettings({ seen_notices: { classic: true } })
    }

    const offerPlayMore = useCallback(() => {
        if (mode !== 'daily') return
        if (!playerReady()) {
            playMoreArmed.current = true
            return
        }
        playMoreArmed.current = false
        if (getProfile()?.seen_notices?.classic_infinite) return
        setPlayMore(true)
        void savePlayerSettings({ seen_notices: { classic_infinite: true } })
    }, [mode])

    useEffect(() => {
        return subscribePlayer(() => {
            if (playMoreArmed.current) offerPlayMore()
        })
    }, [offerPlayMore])

    useEffect(() => {
        const check = () => {
            if (!playerReady()) return
            if (!getProfile()?.seen_notices?.classic) setShowHelp(true)
        }
        check()
        return subscribePlayer(check)
    }, [])

    useEffect(() => {
        let cancel = false
        const load = async () => {
            setLoading(true)
            setError('')
            try {
                const idols = await getClassicPool()
                if (cancel) return
                setPool(idols)
                if (mode === 'daily') {
                    const daily = await loadClassicDaily()
                    if (cancel) return
                    setEndAt(daily.endAt)
                    setServerOffset(
                        new Date(daily.serverNow).getTime() - Date.now()
                    )
                    setWinCount(daily.winCount)
                } else if (!getClassicGame('infinite')?.status) {
                    setFilterOpen(true)
                }
            } catch (err) {
                if (!cancel) setError(friendly(err))
            } finally {
                if (!cancel) setLoading(false)
            }
        }
        void load()
        return () => {
            cancel = true
        }
    }, [mode])

    useEffect(() => {
        if (mode !== 'daily' || !endAt) return
        const id = window.setInterval(() => setNow(Date.now()), 1000)
        return () => window.clearInterval(id)
    }, [mode, endAt])

    const remaining = endAt
        ? new Date(endAt).getTime() - (now + serverOffset)
        : null

    useEffect(() => {
        if (
            mode !== 'daily' ||
            remaining == null ||
            remaining > 0 ||
            rolled.current
        )
            return
        rolled.current = true
        void loadClassicDaily()
            .then((daily) => {
                const offset = new Date(daily.serverNow).getTime() - Date.now()
                setEndAt(daily.endAt)
                setServerOffset(offset)
                setWinCount(daily.winCount)
                setResultOpen(true)
                rolled.current =
                    new Date(daily.endAt).getTime() - (Date.now() + offset) <= 0
            })
            .catch((err) => setError(friendly(err)))
    }, [mode, remaining])

    const finished = game?.status === 'won' || game?.status === 'gave_up'
    const countdown = remaining == null ? null : formatCountdown(remaining)
    const suggestions = useMemo(() => {
        const filter = game?.groupFilter ?? 'both'
        if (filter === 'both') return pool
        return pool.filter((idol) => idol.groupCategory === filter)
    }, [pool, game?.groupFilter])

    const finishReveal = useCallback(() => {
        if (revealTimer.current != null) {
            window.clearTimeout(revealTimer.current)
            revealTimer.current = null
        }
        if (!holdResult.current) return
        holdResult.current = false
        setRevealHold(false)
        setResultOpen(true)
    }, [])

    useEffect(() => {
        return () => {
            if (revealTimer.current != null)
                window.clearTimeout(revealTimer.current)
        }
    }, [])

    const pick = async (idol: ClassicCandidate) => {
        if (busyRef.current || game?.status !== 'in_progress') return
        busyRef.current = true
        setBusy(true)
        setError('')
        try {
            setNewestId(idol.id)
            const result = await submitClassic(mode, idol.id)
            if (result.solved) {
                if (mode === 'daily') setWinCount((count) => (count ?? 0) + 1)
                holdResult.current = true
                setRevealHold(true)
                setResultOpen(false)
                if (revealTimer.current != null)
                    window.clearTimeout(revealTimer.current)
                revealTimer.current = window.setTimeout(
                    finishReveal,
                    CLASSIC_REVEAL_MS + 50
                )
            }
        } catch (err) {
            setError(friendly(err))
        } finally {
            busyRef.current = false
            setBusy(false)
        }
    }

    const reveal = async () => {
        setBusy(true)
        setError('')
        try {
            await giveUpClassic(mode)
            setConfirmGiveUp(false)
            setResultOpen(true)
        } catch (err) {
            setError(friendly(err))
        } finally {
            setBusy(false)
        }
    }

    const next = () => {
        setResultOpen(false)
        setFilterOpen(true)
    }

    const begin = async (group: ClassicGroup) => {
        if (busyRef.current || game?.status === 'in_progress') return
        busyRef.current = true
        setBusy(true)
        setError('')
        try {
            await startClassicRound(group)
            setNewestId(null)
            setConfirmGiveUp(false)
            setFilterOpen(false)
            setResultOpen(false)
        } catch (err) {
            setError(friendly(err))
        } finally {
            busyRef.current = false
            setBusy(false)
        }
    }

    const groupLabel = filterLabel(game?.groupFilter ?? 'both')

    return (
        <div className='min-h-screen bg-white dark:bg-zinc-950'>
            <div className='mx-auto w-full sm:max-w-md'>
                <GameHeader
                    timer={mode === 'daily' && countdown ? countdown : ''}
                    onShowAccount={() => setShowAccount(true)}
                    onShowInfo={() => setShowInfo(true)}
                    gameMode='classic'
                    onGameModeChange={() => {}}
                    showModeToggle={false}
                    onLogoClick={() => router.push('/')}
                />
            </div>

            <div className='mx-auto w-full max-w-7xl px-4 pb-6'>
                <div className='mx-auto mt-4 w-full max-w-md'>
                    <div className='mb-3 text-center'>
                        <h1 className='relative flex items-center justify-center gap-1.5 text-5xl font-bold text-black dark:text-white'>
                            Classic
                            <ProfileSourceNote
                                onReport={() => {
                                    setFeedbackFromInfo(false)
                                    setShowFeedback(true)
                                }}
                            />
                        </h1>
                        {mode === 'daily' && winCount !== null && (
                            <p className='mt-2 text-sm text-gray-500 italic dark:text-zinc-400'>
                                <span className='font-semibold text-pink-600 not-italic'>
                                    {winCount.toLocaleString()}
                                </span>{' '}
                                {winCount === 1 ? 'person has' : 'people have'}{' '}
                                guessed today&apos;s idol
                            </p>
                        )}
                        {mode === 'infinite' &&
                            (game?.status === 'in_progress' ? (
                                <p className='mt-2 text-sm font-semibold text-gray-500 dark:text-zinc-400'>
                                    {groupLabel}
                                </p>
                            ) : (
                                <button
                                    type='button'
                                    onClick={() => setFilterOpen(true)}
                                    className='mt-2 cursor-pointer text-sm font-semibold text-gray-500 underline dark:text-zinc-400'
                                >
                                    {groupLabel}
                                </button>
                            ))}
                    </div>
                    {loading ? (
                        <p className='mt-6 text-center text-sm text-gray-500 dark:text-zinc-400'>
                            Loading...
                        </p>
                    ) : (
                        <IdolSearchInput
                            pool={suggestions}
                            excludedIds={
                                game?.guesses.map((guess) => guess.id) ?? []
                            }
                            disabled={busy || game?.status !== 'in_progress'}
                            pending={busy && game?.status === 'in_progress'}
                            success={game?.status === 'won' && !revealHold}
                            keepGuess={game?.status === 'won'}
                            lockedName={
                                finished ? (game?.answer?.name ?? '') : ''
                            }
                            onPick={(idol) => void pick(idol)}
                        />
                    )}
                </div>

                {!loading && (
                    <>
                        <ColorLegend />
                        {error && (
                            <p className='mt-3 text-center text-sm text-red-600'>
                                {error}
                            </p>
                        )}
                        {mode === 'daily' &&
                            game?.status === 'in_progress' &&
                            game.guesses.length >= 3 && (
                                <div className='mt-4 flex justify-center'>
                                    <button
                                        type='button'
                                        onClick={() => setConfirmGiveUp(true)}
                                        className='cursor-pointer rounded-full bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700'
                                    >
                                        Give up
                                    </button>
                                </div>
                            )}
                        <GuessGrid
                            guesses={game?.guesses ?? []}
                            newestId={newestId}
                            onRevealEnd={finishReveal}
                        />
                        {mode === 'infinite' &&
                            game?.status === 'in_progress' && (
                                <div className='mt-4 flex justify-center'>
                                    <button
                                        type='button'
                                        onClick={() => setConfirmGiveUp(true)}
                                        className='cursor-pointer rounded-full bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700'
                                    >
                                        Give up
                                    </button>
                                </div>
                            )}
                        {finished && !resultOpen && !revealHold && (
                            <div className='mt-4 flex justify-center'>
                                <button
                                    type='button'
                                    onClick={() => setResultOpen(true)}
                                    className='cursor-pointer rounded-full bg-pink-600 px-4 py-2 font-bold text-white hover:bg-pink-700'
                                >
                                    Result
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <GiveUpModal
                open={confirmGiveUp}
                busy={busy}
                onCancel={() => setConfirmGiveUp(false)}
                onReveal={() => void reveal()}
            />
            <ClassicWinModal
                open={!loading && finished && resultOpen}
                mode={mode}
                answer={game?.answer ?? null}
                guesses={game?.guesses ?? []}
                dailyId={game?.dailyId ?? null}
                onClose={() => {
                    setResultOpen(false)
                    offerPlayMore()
                }}
                onNext={() => void next()}
            />
            <AccountModal
                isOpen={showAccount}
                onClose={() => setShowAccount(false)}
            />
            <InfoModal
                isOpen={showInfo}
                onClose={() => setShowInfo(false)}
                onShowFeedback={() => {
                    setFeedbackFromInfo(true)
                    setShowInfo(false)
                    setShowFeedback(true)
                }}
                onShowHelp={() => {
                    setShowInfo(false)
                    setShowHelp(true)
                }}
                onShowHistory={() => {}}
                gameMode='unlimited'
            />
            <ClassicHelpModal
                isOpen={showHelp}
                onClose={() => dismissHelp(false)}
                onBack={() => dismissHelp(true)}
            />
            <FeedbackModal
                isOpen={showFeedback}
                onClose={() => setShowFeedback(false)}
                onBack={() => {
                    setShowFeedback(false)
                    if (feedbackFromInfo) setShowInfo(true)
                }}
            />
            {mode === 'daily' && playMore && (
                <div className='fixed inset-0 z-[520] flex items-center justify-center bg-black/50 p-4'>
                    <motion.div
                        role='dialog'
                        aria-modal='true'
                        aria-labelledby='play-more-title'
                        className='relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                        initial={{ y: 16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                        <button
                            type='button'
                            onClick={() => setPlayMore(false)}
                            className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                            aria-label='Close'
                        >
                            <svg
                                className='h-4 w-4 text-gray-600 dark:text-zinc-400'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M6 18L18 6M6 6l12 12'
                                />
                            </svg>
                        </button>
                        <h2
                            id='play-more-title'
                            className='mt-6 text-xl font-bold text-black dark:text-zinc-100'
                        >
                            Want more idols? Keep playing in Classic Infinite!
                        </h2>
                        <p className='mt-2 text-sm text-gray-600 dark:text-zinc-400'>
                            Enjoy never-ending idol guessing!
                        </p>
                        <Link
                            href='/classic/infinite'
                            className='mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-pink-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-pink-700'
                        >
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width='24'
                                height='24'
                                viewBox='0 0 512 512'
                                aria-hidden
                            >
                                <path
                                    fill='currentColor'
                                    d='M382 136c-40.87 0-73.46 20.53-93.6 37.76l-.71.61l-11.47 12.47l25.32 41.61l18.74-18.79C339.89 193.1 361.78 184 382 184c40.8 0 74 32.3 74 72s-33.2 72-74 72c-62 0-104.14-81.95-104.56-82.78C275 240.29 221.56 136 130 136C62.73 136 8 189.83 8 256s54.73 120 122 120c32.95 0 65.38-13.11 93.79-37.92l.61-.54l11.38-12.38l-25.33-41.61l-18.83 18.88C172 319.4 151.26 328 130 328c-40.8 0-74-32.3-74-72s33.2-72 74-72c62 0 104.14 81.95 104.56 82.78C237 271.71 290.44 376 382 376c67.27 0 122-53.83 122-120s-54.73-120-122-120'
                                />
                            </svg>
                            Play Infinite
                        </Link>
                    </motion.div>
                </div>
            )}
            {mode === 'infinite' && (
                <ClassicFilterModal
                    open={filterOpen && game?.status !== 'in_progress'}
                    value={game?.groupFilter ?? 'both'}
                    busy={busy}
                    onClose={
                        game?.status
                            ? () => {
                                  setFilterOpen(false)
                                  if (finished && !holdResult.current)
                                      setResultOpen(true)
                              }
                            : undefined
                    }
                    onStart={(group) => void begin(group)}
                />
            )}
        </div>
    )
}

function GiveUpModal({
    open,
    busy,
    onCancel,
    onReveal,
}: {
    open: boolean
    busy: boolean
    onCancel: () => void
    onReveal: () => void
}) {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-600 flex items-center justify-center bg-black/40 px-4'>
            <div
                className='modal-fade-in relative w-full max-w-sm rounded-md border border-pink-600 bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                role='dialog'
                aria-modal='true'
                aria-labelledby='classic-give-up-title'
            >
                <button
                    type='button'
                    onClick={onCancel}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
                    aria-label='Close'
                >
                    <CloseIcon />
                </button>
                <h2 id='classic-give-up-title' className='text-xl font-bold'>
                    Give up?
                </h2>
                <p className='mt-2 text-sm text-gray-500 dark:text-zinc-400'>
                    This reveals the answer and ends your streak.
                </p>
                <div className='mt-6 flex justify-center gap-2'>
                    <button
                        type='button'
                        onClick={onCancel}
                        className='cursor-pointer rounded-full bg-gray-200 px-4 py-2 font-bold dark:bg-zinc-800'
                    >
                        Cancel
                    </button>
                    <button
                        type='button'
                        onClick={onReveal}
                        disabled={busy}
                        className='cursor-pointer rounded-full bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700 disabled:opacity-60'
                    >
                        Reveal
                    </button>
                </div>
            </div>
        </div>
    )
}

function CloseIcon() {
    return (
        <svg
            className='h-4 w-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M6 18L18 6M6 6l12 12'
            />
        </svg>
    )
}
