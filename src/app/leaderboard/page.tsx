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

const IMAGE_MODES: ImageMode[] = ['pixelated', 'zoom']

function segmentClass(selected: boolean) {
    return `flex-1 cursor-pointer rounded-full py-1.5 text-sm transition-colors ${
        selected
            ? 'bg-white font-medium dark:bg-zinc-900'
            : 'hover:bg-gray-200 dark:hover:bg-zinc-700'
    }`
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
    const [rows, setRows] = useState<
        Array<{
            rank: number
            nickname: string
            max_streak: number
            is_me: boolean
        }>
    >([])
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
            <ol className='mt-6 space-y-2'>
                {rows.length === 0 ? (
                    <li className='text-sm text-gray-500'>
                        No ranked streaks yet.
                    </li>
                ) : (
                    rows.map((row) => (
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
                    ))
                )}
            </ol>
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
