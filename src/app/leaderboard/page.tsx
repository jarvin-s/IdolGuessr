'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { fetchLeaderboard } from '@/lib/player'
import {
    DIFFICULTIES,
    DIFFICULTY_LABELS,
    IMAGE_MODE_LABELS,
    type ImageMode,
    type InfiniteDifficulty,
} from '@/utils/difficulty'

const TABS = [
    { id: 'daily', label: 'Daily' },
    { id: 'infinite', label: 'Infinite' },
    { id: 'hangul', label: 'Hangul' },
] as const

type Tab = (typeof TABS)[number]['id']

type LeaderboardRow = {
    rank: number
    nickname: string
    max_streak: number
    is_me: boolean
}

const PODIUM = [
    {
        rank: 2,
        emoji: '🥈',
        bar: 'h-16 bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100',
        emptyBar:
            'h-16 bg-zinc-200/40 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500',
    },
    {
        rank: 1,
        emoji: '🏆',
        bar: 'h-24 bg-amber-300 text-amber-950 dark:bg-amber-500 dark:text-amber-950',
        emptyBar:
            'h-24 bg-amber-300/30 text-amber-700/50 dark:bg-amber-900/40 dark:text-amber-200/40',
    },
    {
        rank: 3,
        emoji: '🥉',
        bar: 'h-12 bg-orange-300 text-orange-950 dark:bg-orange-800 dark:text-orange-100',
        emptyBar:
            'h-12 bg-orange-300/30 text-orange-800/40 dark:bg-orange-950/50 dark:text-orange-200/40',
    },
] as const

const IMAGE_MODES: ImageMode[] = ['pixelated', 'zoom']

function segmentClass(selected: boolean) {
    return `flex-1 cursor-pointer rounded-full py-1.5 text-sm transition-colors ${
        selected
            ? 'bg-white font-medium dark:bg-zinc-900'
            : 'hover:bg-gray-200 dark:hover:bg-zinc-700'
    }`
}

function TopThree({ rows }: { rows: LeaderboardRow[] }) {
    if (rows.length === 0) return null

    return (
        <section className='mt-8' aria-label='Top 3'>
            <div className='flex items-end justify-center gap-2 sm:gap-3'>
                {PODIUM.map((slot) => {
                    const row = rows.find((entry) => entry.rank === slot.rank)
                    return (
                        <div
                            key={slot.rank}
                            className={`flex w-1/3 max-w-28 flex-col items-center ${
                                row?.is_me ? 'rounded-xl ring-2 ring-amber-400' : ''
                            }`}
                        >
                            <span
                                className={`${slot.rank === 1 ? 'text-4xl' : 'text-3xl'} ${
                                    row ? '' : 'opacity-40'
                                }`}
                                aria-hidden
                            >
                                {slot.emoji}
                            </span>
                            <p
                                className={`mt-1 w-full truncate px-1 text-center text-sm font-semibold ${
                                    row ? '' : 'text-gray-400 dark:text-zinc-600'
                                }`}
                            >
                                {row?.nickname ?? '—'}
                            </p>
                            <p className='text-xs text-gray-500 dark:text-zinc-400'>
                                {row ? `${row.max_streak} streak` : '\u00a0'}
                            </p>
                            <div
                                className={`mt-2 flex w-full items-start justify-center rounded-t-xl pt-1.5 text-sm font-bold ${
                                    row ? slot.bar : slot.emptyBar
                                }`}
                            >
                                {slot.rank}
                            </div>
                        </div>
                    )
                })}
            </div>
        </section>
    )
}

function OptionGroup({
    label,
    children,
}: {
    label: string
    children: ReactNode
}) {
    return (
        <div>
            <p className='text-xs font-bold tracking-wide text-gray-500 uppercase dark:text-zinc-400'>
                {label}
            </p>
            <div className='mt-2'>{children}</div>
        </div>
    )
}

export default function LeaderboardPage() {
    const [tab, setTab] = useState<Tab>('daily')
    const [difficulty, setDifficulty] = useState<InfiniteDifficulty>('normal')
    const [imageMode, setImageMode] = useState<ImageMode>('pixelated')
    const [rows, setRows] = useState<LeaderboardRow[]>([])
    const [me, setMe] = useState<{
        rank: number | null
        nickname: string | null
        max_streak: number
        eligible: boolean
        is_anonymous: boolean
    } | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        let cancelled = false
        const load = async () => {
            try {
                const data = await fetchLeaderboard(
                    tab,
                    tab === 'infinite' ? difficulty : '',
                    tab === 'infinite' ? imageMode : ''
                )
                if (cancelled) return
                setRows(data.rows ?? [])
                setMe(data.me)
                setError('')
            } catch (err) {
                if (!cancelled)
                    setError(
                        err instanceof Error
                            ? err.message
                            : 'Could not load the leaderboard.'
                    )
            }
        }
        void load()
        return () => {
            cancelled = true
        }
    }, [tab, difficulty, imageMode])

    return (
        <main className='mx-auto min-h-screen max-w-lg px-4 py-10'>
            <Link
                href='/'
                className='inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-200 px-3 transition-colors hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-700'
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
            <h1 className='mt-4 text-3xl font-bold uppercase'>Leaderboard</h1>
            <p className='mt-2 text-sm text-gray-500 dark:text-zinc-400'>
                Highest streak. Guests and accounts without a nickname are left
                off.
            </p>
            <div className='mt-6 space-y-4'>
                <OptionGroup label='Gamemode:'>
                    <div className='flex rounded-full bg-gray-100 p-1 dark:bg-zinc-800'>
                        {TABS.map((item) => (
                            <button
                                key={item.id}
                                type='button'
                                onClick={() => setTab(item.id)}
                                className={segmentClass(tab === item.id)}
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </OptionGroup>
                {tab === 'infinite' ? (
                    <>
                        <OptionGroup label='Difficulty:'>
                            <div className='flex rounded-full bg-gray-100 p-1 dark:bg-zinc-800'>
                                {DIFFICULTIES.map((option) => (
                                    <button
                                        key={option}
                                        type='button'
                                        onClick={() => setDifficulty(option)}
                                        className={segmentClass(
                                            difficulty === option
                                        )}
                                    >
                                        {DIFFICULTY_LABELS[option]}
                                    </button>
                                ))}
                            </div>
                        </OptionGroup>
                        <OptionGroup label='Image:'>
                            <div className='flex rounded-full bg-gray-100 p-1 dark:bg-zinc-800'>
                                {IMAGE_MODES.map((option) => (
                                    <button
                                        key={option}
                                        type='button'
                                        onClick={() => setImageMode(option)}
                                        className={segmentClass(
                                            imageMode === option
                                        )}
                                    >
                                        {IMAGE_MODE_LABELS[option]}
                                    </button>
                                ))}
                            </div>
                        </OptionGroup>
                    </>
                ) : null}
            </div>
            {error ? <p className='mt-4 text-sm'>{error}</p> : null}
            <TopThree rows={rows} />
            {rows.length === 0 ? (
                <p className='mt-6 text-sm text-gray-500'>
                    No ranked streaks yet.
                </p>
            ) : rows.some((row) => row.rank > 3) ? (
                <ol className='mt-6 space-y-2'>
                    {rows
                        .filter((row) => row.rank > 3)
                        .map((row) => (
                            <li
                                key={`${row.rank}-${row.nickname}`}
                                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                                    row.is_me
                                        ? 'bg-amber-50 dark:bg-zinc-800'
                                        : 'bg-gray-50 dark:bg-zinc-900'
                                }`}
                            >
                                <span>
                                    {row.rank}. {row.nickname}
                                </span>
                                <span className='font-medium'>
                                    {row.max_streak}
                                </span>
                            </li>
                        ))}
                </ol>
            ) : null}
            {me ? (
                <p className='mt-6 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-zinc-700'>
                    <span className='font-bold'>You:</span>{' '}
                    {me.nickname ?? 'no nickname'} ·{' '}
                    <span className='font-bold'>Best streak:</span>{' '}
                    {me.max_streak} · <span className='font-bold'>Rank:</span>{' '}
                    {me.rank ?? '-'}{' '}
                    {me.is_anonymous || !me.eligible
                        ? ' · sign in and set a nickname to be ranked'
                        : ''}
                </p>
            ) : null}
        </main>
    )
}
