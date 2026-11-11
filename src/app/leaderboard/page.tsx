'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { fetchLeaderboard } from '@/lib/player'
import {
    DIFFICULTIES,
    DIFFICULTY_LABELS,
    IMAGE_MODE_LABELS,
    type ImageMode,
    type InfiniteDifficulty,
} from '@/utils/difficulty'
import Image from 'next/image'

const TABS = [
    { id: 'daily', label: 'Daily' },
    { id: 'infinite', label: 'Infinite' },
    { id: 'hangul', label: 'Hangul' },
] as const

type Tab = (typeof TABS)[number]['id']

type LeaderboardRow = {
    rank: number
    nickname: string
    avatar_url?: string | null
    max_streak: number
    is_me: boolean
}

const PODIUM = [2, 1, 3] as const
const LIST_ROW_HEIGHT = '3rem'
const LIST_ROW_GAP = '0.5rem'
const VISIBLE_LIST_ROWS = 12

const IMAGE_MODES: ImageMode[] = ['pixelated', 'zoom']

function segmentClass(selected: boolean) {
    return `flex-1 cursor-pointer rounded-full py-1.5 text-sm transition-colors ${
        selected
            ? 'bg-white font-medium dark:bg-zinc-900'
            : 'hover:bg-gray-200 dark:hover:bg-zinc-700'
    }`
}

function AccountImage({ src, size }: { src: string; size: 'podium' | 'list' }) {
    return (
        <Image
            src={src}
            alt='Account image'
            width={size === 'podium' ? 64 : 32}
            height={size === 'podium' ? 64 : 32}
            className={`rounded-full object-cover ${
                size === 'podium' ? 'h-16 w-16' : 'h-8 w-8'
            }`}
        />
    )
}

function PodiumPortrait({ src }: { src?: string | null }) {
    if (!src) {
        return (
            <div className='h-16 w-16 rounded-full bg-gray-200 dark:bg-zinc-800' />
        )
    }
    return <AccountImage src={src} size='podium' />
}

function YouBadge({ prominent }: { prominent: boolean }) {
    return (
        <span
            className={
                prominent
                    ? 'rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-950 uppercase'
                    : 'rounded-full border border-gray-300 px-2 py-0.5 text-[10px] font-medium tracking-wide text-gray-500 uppercase dark:border-zinc-600 dark:text-zinc-400'
            }
        >
            You
        </span>
    )
}

function TopThree({ rows }: { rows: LeaderboardRow[] }) {
    if (rows.length === 0) return null

    return (
        <section className='mt-8 overflow-hidden' aria-label='Top 3'>
            <div className='flex items-end justify-center gap-2 sm:gap-3'>
                {PODIUM.map((rank) => {
                    const row = rows.find((entry) => entry.rank === rank)
                    const stage =
                        rank === 1
                            ? 'h-28 bg-amber-300 dark:bg-amber-500'
                            : rank === 2
                              ? 'h-16 bg-zinc-200 dark:bg-zinc-700'
                              : 'h-16 bg-orange-300 dark:bg-orange-800'
                    return (
                        <div
                            key={rank}
                            className='flex w-1/3 max-w-28 flex-col items-center'
                        >
                            {rank === 1 ? (
                                <span
                                    className='text-3xl leading-none'
                                    aria-hidden
                                >
                                    👑
                                </span>
                            ) : null}
                            <div className='mt-2'>
                                <PodiumPortrait src={row?.avatar_url} />
                            </div>
                            <p
                                className={`mt-2 w-full truncate px-1 text-center text-sm font-semibold ${
                                    row
                                        ? ''
                                        : 'text-gray-400 dark:text-zinc-600'
                                }`}
                            >
                                {row?.nickname ?? '—'}
                            </p>
                            <div className='mt-1 flex h-5 items-center'>
                                {row?.is_me ? <YouBadge prominent /> : null}
                            </div>
                            <p className='text-xs text-gray-500 dark:text-zinc-400'>
                                {row ? `${row.max_streak} streak` : '\u00a0'}
                            </p>
                            {rank === 1 ? null : (
                                <span
                                    className={`mt-1 text-2xl leading-none ${row ? '' : 'opacity-40'}`}
                                    aria-hidden
                                >
                                    {rank === 2 ? '🥈' : '🥉'}
                                </span>
                            )}
                            <div
                                className={`mt-2 -mb-8 w-full rounded-t-2xl ${stage}`}
                            />
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
    const { profile, isGuest } = useAuth()
    const needsNickname = !profile?.nickname?.trim()
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
            {needsNickname ? (
                <p className='mt-4 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-zinc-900 dark:text-amber-100'>
                    {isGuest ? 'Sign in, then choose' : 'Choose'} a nickname on
                    your{' '}
                    <Link href='/profile' className='font-semibold underline'>
                        profile page
                    </Link>{' '}
                    and you will show up on the leaderboard.
                </p>
            ) : null}
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
                <ol
                    className='hide-scrollbar mt-6 flex flex-col gap-2 overflow-y-auto'
                    style={{
                        maxHeight: `calc(${VISIBLE_LIST_ROWS} * ${LIST_ROW_HEIGHT} + ${VISIBLE_LIST_ROWS} * ${LIST_ROW_GAP} + ${LIST_ROW_HEIGHT} / 2)`,
                    }}
                >
                    {rows
                        .filter((row) => row.rank > 3)
                        .map((row) => (
                            <li
                                key={`${row.rank}-${row.nickname}`}
                                className={`flex h-12 shrink-0 items-center justify-between gap-3 rounded-lg px-3 text-sm ${
                                    row.is_me
                                        ? 'bg-amber-50 dark:bg-zinc-800'
                                        : 'bg-gray-50 dark:bg-zinc-900'
                                }`}
                            >
                                <span className='flex min-w-0 items-center gap-2'>
                                    {row.avatar_url ? (
                                        <AccountImage
                                            src={row.avatar_url}
                                            size='list'
                                        />
                                    ) : null}
                                    <span className='truncate'>
                                        {row.rank}. {row.nickname}
                                    </span>
                                    {row.is_me ? (
                                        <YouBadge prominent={false} />
                                    ) : null}
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
                    <span className='font-bold'>You:</span> {me.nickname ?? '?'}{' '}
                    · <span className='font-bold'>Best streak:</span>{' '}
                    {me.max_streak} · <span className='font-bold'>Rank:</span>{' '}
                    {me.rank ?? '?'}
                    {me.nickname ? null : (
                        <>
                            {' '}
                            ·{' '}
                            {me.is_anonymous
                                ? 'Sign in and add a nickname on your '
                                : 'Add a nickname on your '}
                            <Link
                                href='/profile'
                                className='font-semibold underline'
                            >
                                profile page
                            </Link>{' '}
                            and you will show up on the leaderboard.
                        </>
                    )}
                </p>
            ) : null}
        </main>
    )
}
