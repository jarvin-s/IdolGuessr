'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import PuzzleBoard from '@/components/unshuffled/PuzzleBoard'
import PuzzlePiece from '@/components/unshuffled/PuzzlePiece'
import UnshuffledStartModal from '@/components/unshuffled/UnshuffledStartModal'
import {
    isLockedSlot,
    LOCKED_SLOTS,
    useUnshuffledGame,
} from '@/hooks/useUnshuffledGame'
import { useSnippetPlayer } from '@/hooks/useSnippetPlayer'
import {
    getUnshuffledSong,
    submitUnshuffledResult,
    type UnshuffledSong,
} from '@/lib/unshuffled'

export default function UnshuffledPage() {
    const [song, setSong] = useState<UnshuffledSong | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [started, setStarted] = useState(false)
    const [hoverSlot, setHoverSlot] = useState<number | null>(null)
    const saved = useRef(false)
    const {
        board,
        tray,
        checksUsed,
        wrongSlots,
        won,
        place,
        returnToTray,
        check,
        shuffle,
    } = useUnshuffledGame()
    const { playSlice, playSequence, stop, unlock, playing } = useSnippetPlayer(
        song?.previewUrl ?? null
    )

    useEffect(() => {
        let cancelled = false
        getUnshuffledSong()
            .then((next) => {
                if (!cancelled) setSong(next)
            })
            .catch((err: unknown) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Could not load the song'
                    )
                }
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [])

    useEffect(() => {
        if (!won || !song || saved.current) return
        saved.current = true
        void submitUnshuffledResult(song.id, checksUsed).catch(
            (err: unknown) => {
                console.error(err)
                saved.current = false
            }
        )
    }, [won, song, checksUsed])

    const midpoint = Math.ceil(tray.length / 2)
    const leftTray = tray.slice(0, midpoint)
    const rightTray = tray.slice(midpoint)

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

    function playAgain() {
        saved.current = false
        stop()
        shuffle()
    }

    return (
        <main className='mx-auto flex min-h-screen max-w-4xl flex-col px-4 py-8'>
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

            <h1 className='mt-4 text-center text-3xl font-bold'>
                IdolGuessr{' '}
                <span className='uppercase'>
                    Unshuffled
                </span>
            </h1>
            {error && (
                <p className='mt-8 text-center text-sm text-red-600'>{error}</p>
            )}

            {song && (
                <>
                    <div className='mt-6 flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-center'>
                        <Tray
                            pieces={leftTray}
                            artworkUrl={song.artworkUrl}
                            className='order-2 md:order-1 md:w-16'
                            onTap={playSlice}
                            onDragMove={handleDragMove}
                            onDragEnd={handleDragEnd}
                        />
                        <div className='order-1 w-full max-w-[440px] md:order-2'>
                            <PuzzleBoard
                                board={board}
                                artworkUrl={song.artworkUrl}
                                hoverSlot={hoverSlot}
                                wrongSlots={wrongSlots}
                                lockedSlots={LOCKED_SLOTS}
                                onTap={playSlice}
                                onDragMove={handleDragMove}
                                onDragEnd={handleDragEnd}
                            />
                        </div>
                        <Tray
                            pieces={rightTray}
                            artworkUrl={song.artworkUrl}
                            className='order-3 md:w-16'
                            onTap={playSlice}
                            onDragMove={handleDragMove}
                            onDragEnd={handleDragEnd}
                        />
                    </div>

                    <div className='mt-6 flex items-center justify-center gap-3'>
                        <button
                            type='button'
                            onClick={playBoard}
                            aria-label={
                                playing ? 'Stop preview' : 'Play the board'
                            }
                            className='flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-black text-white dark:bg-white dark:text-black'
                        >
                            {playing ? <PauseIcon /> : <PlayIcon />}
                        </button>
                        <button
                            type='button'
                            onClick={check}
                            disabled={won || wrongSlots.length > 0}
                            className='cursor-pointer rounded-full bg-gray-200 px-6 py-3 text-sm font-semibold transition-colors hover:bg-gray-300 disabled:cursor-default disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        >
                            Check
                        </button>
                    </div>

                    {won && (
                        <div className='mt-6 flex flex-col items-center text-center'>
                            <div
                                className='h-40 w-40 rounded-lg bg-cover bg-center'
                                style={{
                                    backgroundImage: `url("${song.artworkUrl}")`,
                                }}
                                role='img'
                                aria-label={`${song.songName} artwork`}
                            />
                            <p className='mt-3 text-2xl font-bold'>
                                {song.songName}
                            </p>
                            <p className='text-gray-500 dark:text-zinc-400'>
                                {song.artistName}
                            </p>
                            <p className='mt-1 text-sm text-gray-500 dark:text-zinc-400'>
                                Solved in {checksUsed}{' '}
                                {checksUsed === 1 ? 'check' : 'checks'}
                            </p>
                            <button
                                type='button'
                                onClick={playAgain}
                                className='mt-4 cursor-pointer rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-white dark:bg-white dark:text-black'
                            >
                                Play again
                            </button>
                        </div>
                    )}

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

            <UnshuffledStartModal
                open={!started}
                loading={loading}
                error={error}
                onStart={() => {
                    setStarted(true)
                    void unlock()
                }}
            />
        </main>
    )
}

function Tray({
    pieces,
    artworkUrl,
    className,
    onTap,
    onDragMove,
    onDragEnd,
}: {
    pieces: number[]
    artworkUrl: string
    className: string
    onTap: (piece: number) => void
    onDragMove: (slot: number | null) => void
    onDragEnd: (piece: number, slot: number | null) => void
}) {
    return (
        <div
            className={`flex flex-wrap justify-center gap-2 md:flex-col ${className}`}
        >
            {pieces.map((piece) => (
                <PuzzlePiece
                    key={piece}
                    piece={piece}
                    artworkUrl={artworkUrl}
                    className='h-14 w-14 rounded-sm sm:h-16 sm:w-16'
                    onTap={onTap}
                    onDragMove={onDragMove}
                    onDragEnd={onDragEnd}
                />
            ))}
        </div>
    )
}

function PlayIcon() {
    return (
        <svg
            width='22'
            height='22'
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
            width='22'
            height='22'
            viewBox='0 0 24 24'
            fill='currentColor'
            aria-hidden='true'
        >
            <rect x='6' y='5' width='4' height='14' rx='1' />
            <rect x='14' y='5' width='4' height='14' rx='1' />
        </svg>
    )
}
