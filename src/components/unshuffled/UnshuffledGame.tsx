'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import PuzzleBoard from '@/components/unshuffled/PuzzleBoard'
import PuzzlePiece from '@/components/unshuffled/PuzzlePiece'
import UnshuffledGroupFilterModal from '@/components/unshuffled/UnshuffledGroupFilterModal'
import UnshuffledPauseModal from '@/components/unshuffled/UnshuffledPauseModal'
import UnshuffledModeModal from '@/components/unshuffled/UnshuffledModeModal'
import UnshuffledStartModal from '@/components/unshuffled/UnshuffledStartModal'
import {
    scatterPosition,
    scatterSpots,
    type ScatterSpot,
} from '@/components/unshuffled/scatter'
import {
    isLockedSlot,
    LOCKED_SLOTS,
    useUnshuffledGame,
} from '@/hooks/useUnshuffledGame'
import { useSnippetPlayer } from '@/hooks/useSnippetPlayer'
import {
    getCurrentUnshuffledDaily,
    getRandomUnshuffledSong,
    getUnshuffledArtists,
    submitUnshuffledResult,
    type UnshuffledArtist,
    type UnshuffledDaily,
    type UnshuffledMode,
    type UnshuffledSong,
} from '@/lib/unshuffled'
import {
    loadUnshuffledDailyCompletion,
    loadUnshuffledGroups,
    saveUnshuffledDailyCompletion,
    saveUnshuffledGroups,
} from '@/utils/unshuffledStorage'

const CHECK_PENALTY_SECONDS = 10
const RECENT_SONG_LIMIT = 50

function formatUnshuffledTime(totalSeconds: number) {
    const safe = Math.max(0, totalSeconds)
    const minutes = Math.floor(safe / 60)
    const seconds = safe % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
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

function formatGroupSelection(groups: string[]) {
    if (groups.length === 0) return 'All groups'
    if (groups.length === 1) return groups[0]
    return `${groups.length} groups`
}

function errorMessage(err: unknown) {
    return err instanceof Error ? err.message : 'Could not load the song'
}

export default function UnshuffledGame({ mode }: { mode: UnshuffledMode }) {
    const router = useRouter()
    const [song, setSong] = useState<UnshuffledSong | null>(null)
    const [daily, setDaily] = useState<UnshuffledDaily | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [started, setStarted] = useState(false)
    const [hoverSlot, setHoverSlot] = useState<number | null>(null)
    const [songLoading, setSongLoading] = useState(false)
    const [penaltySeconds, setPenaltySeconds] = useState(0)
    const [elapsedMs, setElapsedMs] = useState(0)
    const [clockRunning, setClockRunning] = useState(false)
    const [paused, setPaused] = useState(false)
    const [frozenSeconds, setFrozenSeconds] = useState<number | null>(null)
    const [artists, setArtists] = useState<UnshuffledArtist[]>([])
    const [groups, setGroups] = useState<string[]>([])
    const [filterOpen, setFilterOpen] = useState(false)
    const [resultDismissed, setResultDismissed] = useState(false)
    const [modeOpen, setModeOpen] = useState(false)
    const saved = useRef(false)
    const startedAt = useRef<number | null>(null)
    const elapsedMsRef = useRef(0)
    const secondsRef = useRef(0)
    const recentSongs = useRef<number[]>([])
    const {
        board,
        tray,
        checksUsed,
        correctSlots,
        won,
        scatterSeed,
        place,
        returnToTray,
        check,
        shuffle,
        restoreSolved,
    } = useUnshuffledGame()

    useEffect(() => {
        if (!won) setResultDismissed(false)
    }, [won])

    const {
        playSlice,
        playSequence,
        stop,
        unlock,
        playing,
        activePiece,
        volume,
        setVolume,
    } = useSnippetPlayer(song?.previewUrl ?? null)

    function rememberSong(id: number) {
        recentSongs.current = [
            id,
            ...recentSongs.current.filter((item) => item !== id),
        ].slice(0, RECENT_SONG_LIMIT)
    }

    useEffect(() => {
        let cancelled = false

        async function loadDaily() {
            const today = await getCurrentUnshuffledDaily()
            if (cancelled) return
            setDaily(today)
            setSong(today.song)
            const completion = loadUnshuffledDailyCompletion(today.dailyId)
            if (completion) {
                saved.current = true
                restoreSolved(completion.checks)
                setFrozenSeconds(completion.seconds)
                setStarted(true)
            }
        }

        async function loadInfinite() {
            const list = await getUnshuffledArtists().catch(
                (): UnshuffledArtist[] => []
            )
            const savedGroups = loadUnshuffledGroups()
            const known = new Set(list.map((artist) => artist.name))
            const validGroups =
                list.length > 0
                    ? savedGroups.filter((name) => known.has(name))
                    : savedGroups
            if (validGroups.length !== savedGroups.length) {
                saveUnshuffledGroups(validGroups)
            }
            if (cancelled) return
            setArtists(list)
            setGroups(validGroups)
            const next = await getRandomUnshuffledSong({ artists: validGroups })
            if (cancelled) return
            recentSongs.current = [next.id]
            setSong(next)
        }

        ;(mode === 'daily' ? loadDaily() : loadInfinite())
            .catch((err: unknown) => {
                if (!cancelled) setError(errorMessage(err))
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [mode, restoreSolved])

    useEffect(() => {
        if (!clockRunning) return
        const id = window.setInterval(() => {
            if (startedAt.current === null) return
            const next = Date.now() - startedAt.current
            elapsedMsRef.current = next
            setElapsedMs(next)
        }, 200)
        return () => window.clearInterval(id)
    }, [clockRunning])

    useEffect(() => {
        if (!started || won) return

        function onVisibilityChange() {
            if (document.visibilityState !== 'hidden') return
            if (startedAt.current !== null) {
                const next = Date.now() - startedAt.current
                elapsedMsRef.current = next
                setElapsedMs(next)
                startedAt.current = null
            }
            setClockRunning(false)
            stop()
            setPaused(true)
        }

        document.addEventListener('visibilitychange', onVisibilityChange)
        return () =>
            document.removeEventListener('visibilitychange', onVisibilityChange)
    }, [started, won, stop])

    const liveSeconds = Math.floor(elapsedMs / 1000) + penaltySeconds
    const displaySeconds = frozenSeconds ?? liveSeconds
    secondsRef.current = displaySeconds

    useEffect(() => {
        if (!won || !song || saved.current) return
        const seconds = secondsRef.current
        saved.current = true
        setClockRunning(false)
        setFrozenSeconds(seconds)
        if (mode === 'daily' && daily) {
            saveUnshuffledDailyCompletion({
                dailyId: daily.dailyId,
                seconds,
                checks: checksUsed,
            })
        }
        void submitUnshuffledResult(
            song.id,
            checksUsed,
            seconds,
            mode,
            daily?.dailyId
        ).catch((err: unknown) => {
            console.error(err)
            if (mode === 'infinite') saved.current = false
        })
    }, [won, song, checksUsed, mode, daily])

    const spots = useMemo(() => scatterSpots(scatterSeed), [scatterSeed])
    const scattered = useMemo(() => {
        const groups: [number[], number[]] = [[], []]
        for (const piece of tray) {
            const spot = spots.get(piece)
            if (!spot) continue
            groups[spot.group].push(piece)
        }
        for (const group of groups) {
            group.sort(
                (a, b) =>
                    (spots.get(a)?.index ?? 0) - (spots.get(b)?.index ?? 0)
            )
        }
        return groups
    }, [tray, spots])

    function handleDragMove(slot: number | null) {
        setHoverSlot(slot !== null && !isLockedSlot(slot) ? slot : null)
    }

    function handleDragEnd(piece: number, slot: number | null) {
        const target = slot !== null && !isLockedSlot(slot) ? slot : null
        setHoverSlot(null)
        if (target === null) {
            const from = board.indexOf(piece)
            if (from >= 0 && !isLockedSlot(from)) returnToTray(from)
            return
        }
        place(piece, target)
    }

    function playBoard() {
        if (playing) {
            stop()
            return
        }
        playSequence(board.filter((piece): piece is number => piece !== null))
    }

    function playBoardFrom(piece: number) {
        const slot = board.indexOf(piece)
        if (slot < 0) {
            playSlice(piece)
            return
        }
        playSequence(
            board.slice(slot).filter((item): item is number => item !== null)
        )
    }

    function resetClock() {
        startedAt.current = Date.now()
        elapsedMsRef.current = 0
        setElapsedMs(0)
        setPenaltySeconds(0)
        setFrozenSeconds(null)
        setPaused(false)
        setClockRunning(true)
    }

    function resumeGame() {
        startedAt.current = Date.now() - elapsedMsRef.current
        setPaused(false)
        setClockRunning(true)
    }

    function handleCheck() {
        if (won) return
        setPenaltySeconds((current) => current + CHECK_PENALTY_SECONDS)
        check()
    }

    function playAgain() {
        saved.current = false
        stop()
        shuffle()
        resetClock()
    }

    function resetBoard() {
        saved.current = false
        stop()
        shuffle()
    }

    async function loadRandomSong(selection = groups) {
        if (songLoading) return
        setSongLoading(true)
        setError('')
        try {
            const next = await getRandomUnshuffledSong({
                artists: selection,
                exclude: song
                    ? [song.id, ...recentSongs.current]
                    : recentSongs.current,
            })
            rememberSong(next.id)
            saved.current = false
            stop()
            shuffle()
            if (started) resetClock()
            setSong(next)
        } catch (err: unknown) {
            setError(errorMessage(err))
        } finally {
            setSongLoading(false)
        }
    }

    function applyGroups(next: string[]) {
        setFilterOpen(false)
        setGroups(next)
        saveUnshuffledGroups(next)
        recentSongs.current = []
        void loadRandomSong(next)
    }

    const hasPlacedPiece = board.some(
        (piece, slot) => piece !== null && !isLockedSlot(slot)
    )

    return (
        <main className='mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8'>
            <div className='relative z-[550] flex items-center justify-between gap-3'>
            <Link
                href='/'
                className='inline-flex h-8 w-fit cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-200 px-3 transition-colors hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                aria-label='Back to the game'
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
                        d='M10 19l-7-7m0 0l7-7m-7 7h18'
                    />
                </svg>
                <span className='text-sm text-gray-600 dark:text-zinc-400'>
                    Back to the game
                </span>
            </Link>
                <button
                    type='button'
                    onClick={() => setModeOpen(true)}
                    className='inline-flex h-8 cursor-pointer items-center rounded-full bg-gray-200 px-3 text-sm text-gray-600 transition-colors hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                >
                    {mode === 'daily' ? 'Daily' : 'Unlimited'}
                </button>
            </div>

            {error && (
                <p className='mt-8 text-center text-sm text-red-600'>{error}</p>
            )}

            {song && (
                <>
                    <div className='relative mt-4 w-full py-1 lg:mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_27.5rem_minmax(0,1fr)] lg:items-stretch lg:py-8'>
                        <ScatterPane
                            pieces={scattered[0]}
                            spots={spots}
                            wide
                            artworkUrl={song.artworkUrl}
                            className='relative z-10 hidden lg:col-start-1 lg:row-start-1 lg:block'
                            pieceClassName='h-[5.5rem] w-[5.5rem] rounded-xl shadow-lg'
                            activePiece={activePiece}
                            onTap={playSlice}
                            onDragMove={handleDragMove}
                            onDragEnd={handleDragEnd}
                        />
                        <div className='relative z-0 mx-auto w-full max-w-[320px] md:max-w-[27.5rem] lg:col-start-2 lg:row-start-1'>
                            <div className='mb-3 flex flex-col items-center gap-y-2'>
                                <div
                                    aria-hidden
                                    className='hidden rounded-full px-3 py-1.5 font-mono text-sm font-bold tabular-nums md:invisible md:block'
                                >
                                    {formatUnshuffledTime(displaySeconds)}
                                </div>
                                <div
                                    className={`rounded-full bg-gray-200 px-3 py-1.5 font-mono text-xl font-bold text-black dark:bg-zinc-800 dark:text-zinc-100 ${
                                        started ? '' : 'invisible'
                                    }`}
                                >
                                    {formatUnshuffledTime(displaySeconds)}
                                </div>
                                <div className='order-2 flex min-w-0 items-center justify-center gap-1 md:order-none md:gap-2'>
                                    {!(mode === 'daily' && won) && (
                                    <button
                                        type='button'
                                        onClick={handleCheck}
                                        disabled={won}
                                        aria-hidden={!hasPlacedPiece}
                                        tabIndex={hasPlacedPiece ? 0 : -1}
                                        className={`inline-flex items-center justify-center gap-1 rounded-full bg-pink-500 p-2 text-[13px] font-bold whitespace-nowrap text-white transition-colors hover:bg-pink-600 md:px-3 md:py-2 md:text-sm dark:bg-pink-800 dark:hover:bg-pink-700 ${
                                            hasPlacedPiece
                                                ? 'cursor-pointer'
                                                : 'pointer-events-none invisible'
                                        }`}
                                    >
                                        <span
                                            aria-hidden
                                            className='inline-block h-4 w-4 bg-current mask-contain mask-center mask-no-repeat'
                                            style={{
                                                maskImage:
                                                    'url(/icons/checkmark.svg)',
                                                WebkitMaskImage:
                                                    'url(/icons/checkmark.svg)',
                                            }}
                                        />
                                        Check
                                    </button>
                                    )}
                                    {mode === 'daily' && won && (
                                        <button
                                            type='button'
                                            onClick={() =>
                                                setResultDismissed(false)
                                            }
                                            className='inline-flex cursor-pointer items-center justify-center rounded-full bg-pink-500 p-2 text-[13px] font-bold whitespace-nowrap text-white transition-colors hover:bg-pink-600 md:px-3 md:py-2 md:text-sm dark:bg-pink-800 dark:hover:bg-pink-700'
                                        >
                                            Results
                                        </button>
                                    )}
                                    {mode === 'infinite' && (
                                        <>
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    setFilterOpen(true)
                                                }
                                                aria-label={`Groups: ${formatGroupSelection(groups)}`}
                                                className='inline-flex cursor-pointer items-center justify-center gap-1 rounded-full bg-zinc-500 p-2 text-[13px] font-bold whitespace-nowrap text-white transition-colors hover:bg-zinc-600 md:px-3 md:py-2 md:text-sm dark:bg-zinc-800 dark:hover:bg-zinc-700'
                                            >
                                                <FilterIcon />
                                                <span className='hidden max-w-[8rem] truncate md:inline'>
                                                    {formatGroupSelection(
                                                        groups
                                                    )}
                                                </span>
                                            </button>
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    void loadRandomSong()
                                                }
                                                disabled={songLoading}
                                                className='inline-flex cursor-pointer items-center justify-center gap-1 rounded-full bg-zinc-500 p-2 text-[13px] font-bold whitespace-nowrap text-white transition-colors hover:bg-zinc-600 md:px-3 md:py-2 md:text-sm dark:bg-zinc-800 dark:hover:bg-zinc-700'
                                            >
                                                <span
                                                    aria-hidden
                                                    className='inline-block h-4 w-4 bg-current mask-contain mask-center mask-no-repeat'
                                                    style={{
                                                        maskImage:
                                                            'url(/icons/dice.svg)',
                                                        WebkitMaskImage:
                                                            'url(/icons/dice.svg)',
                                                    }}
                                                />
                                                {songLoading
                                                    ? 'Loading…'
                                                    : 'Get random song'}
                                            </button>
                                        </>
                                    )}
                                    {!(mode === 'daily' && won) && (
                                    <button
                                        type='button'
                                        onClick={resetBoard}
                                        disabled={!hasPlacedPiece || won}
                                        aria-label='Reset'
                                        aria-hidden={!hasPlacedPiece}
                                        tabIndex={hasPlacedPiece ? 0 : -1}
                                        className={`inline-flex items-center justify-center rounded-full bg-pink-500 p-2 text-[13px] font-bold whitespace-nowrap text-white transition-colors hover:bg-pink-600 md:px-3 md:py-2 md:text-sm dark:bg-pink-800 dark:hover:bg-pink-700 ${
                                            hasPlacedPiece
                                                ? 'cursor-pointer'
                                                : 'pointer-events-none invisible'
                                        }`}
                                    >
                                        <span
                                            aria-hidden
                                            className='inline-block h-4 w-4 bg-current mask-contain mask-center mask-no-repeat'
                                            style={{
                                                maskImage:
                                                    'url(/icons/reset.svg)',
                                                WebkitMaskImage:
                                                    'url(/icons/reset.svg)',
                                            }}
                                        />
                                        <span className='hidden md:inline'>
                                            Reset
                                        </span>
                                    </button>
                                    )}
                                </div>
                            </div>
                            <PuzzleBoard
                                board={board}
                                artworkUrl={song.artworkUrl}
                                hoverSlot={hoverSlot}
                                correctSlots={correctSlots}
                                lockedSlots={LOCKED_SLOTS}
                                activePiece={activePiece}
                                onTap={playBoardFrom}
                                onDragMove={handleDragMove}
                                onDragEnd={handleDragEnd}
                            />
                        </div>
                        <ScatterPane
                            pieces={scattered[1]}
                            spots={spots}
                            wide
                            artworkUrl={song.artworkUrl}
                            className='relative z-10 hidden lg:col-start-3 lg:row-start-1 lg:block'
                            pieceClassName='h-[5.5rem] w-[5.5rem] rounded-xl shadow-lg'
                            activePiece={activePiece}
                            onTap={playSlice}
                            onDragMove={handleDragMove}
                            onDragEnd={handleDragEnd}
                        />
                    </div>

                    <label className='mt-2 flex items-center justify-center gap-3'>
                        <button
                            type='button'
                            onClick={playBoard}
                            aria-label={
                                playing ? 'Stop preview' : 'Play the board'
                            }
                            className='flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black'
                        >
                            {playing ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <span className='text-sm text-gray-500 dark:text-zinc-400'>
                            Volume
                        </span>
                        <input
                            type='range'
                            min={0}
                            max={100}
                            step={1}
                            value={Math.round(volume * 100)}
                            onChange={(event) =>
                                setVolume(Number(event.target.value) / 100)
                            }
                            className='h-2 w-24 cursor-pointer accent-black dark:accent-white'
                        />
                    </label>

                    <ScatterPane
                        pieces={tray}
                        spots={spots}
                        wide={false}
                        artworkUrl={song.artworkUrl}
                        className='relative z-10 mx-auto mt-3 h-28 w-full max-w-[27.5rem] lg:hidden'
                        pieceClassName='h-14 w-14 rounded-xl shadow-lg'
                        activePiece={activePiece}
                        onTap={playSlice}
                        onDragMove={handleDragMove}
                        onDragEnd={handleDragEnd}
                    />

                    <p className='mt-8 text-center text-sm text-gray-500 dark:text-zinc-500'>
                        {song.trackViewUrl ? (
                            <a
                                href={song.trackViewUrl}
                                target='_blank'
                                rel='noreferrer'
                                className='underline'
                            >
                                Preview courtesy of Apple Music
                            </a>
                        ) : (
                            'Preview courtesy of Apple Music'
                        )}
                    </p>
                </>
            )}

            {won && !resultDismissed && song && (
                <div className='fixed inset-0 z-[500] flex items-center justify-center bg-black/40 px-4'>
                    <div
                        className='w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                        role='dialog'
                        aria-labelledby='unshuffled-result-title'
                    >
                        <div
                            className='mx-auto h-40 w-40 rounded-lg bg-cover bg-center'
                            style={{
                                backgroundImage: `url("${song.artworkUrl}")`,
                            }}
                            role='img'
                            aria-label={`${song.songName} artwork`}
                        />
                        <h2
                            id='unshuffled-result-title'
                            className='mt-3 text-2xl font-bold'
                        >
                            {song.songName}
                        </h2>
                        <p className='text-gray-500 dark:text-zinc-400'>
                            {song.artistName}
                        </p>
                        <p className='mt-1 text-sm text-gray-500 dark:text-zinc-400'>
                            Solved in {formatUnshuffledTime(displaySeconds)}{' '}
                            with {checksUsed}{' '}
                            {checksUsed === 1 ? 'check' : 'checks'}
                        </p>
                        {mode === 'daily' && daily ? (
                            <>
                                <NextDailyCountdown daily={daily} />
                                <button
                                    type='button'
                                    onClick={() => setResultDismissed(true)}
                                    className='mt-3 w-full cursor-pointer rounded-full bg-gray-100 py-3 font-semibold text-black dark:bg-zinc-800 dark:text-white'
                                >
                                    Close
                                </button>
                            </>
                        ) : (
                            <button
                                type='button'
                                onClick={playAgain}
                                className='mt-6 w-full cursor-pointer rounded-full bg-black py-3 font-semibold text-white dark:bg-white dark:text-black'
                            >
                                Play again
                            </button>
                        )}
                    </div>
                </div>
            )}

            <UnshuffledPauseModal open={paused && !won} onResume={resumeGame} />

            <UnshuffledModeModal
                open={modeOpen}
                active={mode}
                onClose={() => setModeOpen(false)}
                onDaily={() => {
                    setModeOpen(false)
                    if (mode !== 'daily') router.push('/unshuffled/daily')
                }}
                onUnlimited={() => {
                    setModeOpen(false)
                    if (mode !== 'infinite') router.push('/unshuffled')
                }}
            />

            <UnshuffledStartModal
                open={!started}
                mode={mode}
                loading={loading || songLoading}
                error={error}
                groupLabel={formatGroupSelection(groups)}
                onChooseGroups={() => setFilterOpen(true)}
                onStart={() => {
                    setStarted(true)
                    resetClock()
                    void unlock()
                }}
            />

            {mode === 'infinite' && (
                <UnshuffledGroupFilterModal
                    open={filterOpen}
                    artists={artists}
                    selected={groups}
                    onClose={() => setFilterOpen(false)}
                    onConfirm={applyGroups}
                />
            )}
        </main>
    )
}

function NextDailyCountdown({ daily }: { daily: UnshuffledDaily }) {
    const offset = useMemo(
        () => new Date(daily.serverNow).getTime() - Date.now(),
        [daily.serverNow]
    )
    const endAt = new Date(daily.endAt).getTime()
    const [now, setNow] = useState(() => Date.now() + offset)

    useEffect(() => {
        const id = window.setInterval(() => setNow(Date.now() + offset), 1000)
        return () => window.clearInterval(id)
    }, [offset])

    const remaining = endAt - now

    if (remaining <= 0) {
        return (
            <button
                type='button'
                onClick={() => window.location.reload()}
                className='mt-6 w-full cursor-pointer rounded-full bg-black py-3 font-semibold text-white dark:bg-white dark:text-black'
            >
                Play the new song
            </button>
        )
    }

    return (
        <div className='mt-6'>
            <p className='text-sm text-gray-500 dark:text-zinc-400'>
                Next song in
            </p>
            <p className='font-mono text-2xl font-bold tabular-nums'>
                {formatCountdown(remaining)}
            </p>
        </div>
    )
}

function ScatterPane({
    pieces,
    spots,
    wide,
    artworkUrl,
    className,
    pieceClassName,
    activePiece,
    onTap,
    onDragMove,
    onDragEnd,
}: {
    pieces: number[]
    spots: Map<number, ScatterSpot>
    wide: boolean
    artworkUrl: string
    className: string
    pieceClassName: string
    activePiece: number | null
    onTap: (piece: number) => void
    onDragMove: (slot: number | null) => void
    onDragEnd: (piece: number, slot: number | null) => void
}) {
    return (
        <div className={className}>
            {pieces.map((piece) => {
                const spot = spots.get(piece)
                if (!spot) return null
                const position = scatterPosition(spot, wide)
                return (
                    <div
                        key={piece}
                        className='absolute hover:z-[30]'
                        style={{
                            left: `${position.x}%`,
                            top: `${position.y}%`,
                            zIndex: Math.round(position.y),
                            transform: `translate(-50%, -50%) rotate(${position.rotate}deg)`,
                        }}
                    >
                        <PuzzlePiece
                            piece={piece}
                            artworkUrl={artworkUrl}
                            className={pieceClassName}
                            active={activePiece === piece}
                            onTap={onTap}
                            onDragMove={onDragMove}
                            onDragEnd={onDragEnd}
                        />
                    </div>
                )
            })}
        </div>
    )
}

function FilterIcon() {
    return (
        <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={2.5}
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden='true'
        >
            <path d='M4 5h16l-6 8v5l-4 2v-7L4 5Z' />
        </svg>
    )
}

function PlayIcon() {
    return (
        <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='currentColor'
            aria-hidden='true'
        >
            <path d='M8 5.14v13.72a1 1 0 0 0 1.5.86l11.04-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14Z' />
        </svg>
    )
}

function PauseIcon() {
    return (
        <svg
            width='16'
            height='16'
            viewBox='0 0 24 24'
            fill='currentColor'
            aria-hidden='true'
        >
            <rect x='6' y='5' width='4' height='14' rx='1' />
            <rect x='14' y='5' width='4' height='14' rx='1' />
        </svg>
    )
}
