'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { fetchLeaderboard } from '@/lib/player'
import { DIFFICULTIES, DIFFICULTY_LABELS, type ImageMode, type InfiniteDifficulty } from '@/utils/difficulty'

const TABS = [
    { id: 'daily', label: 'Daily' },
    { id: 'infinite', label: 'Infinite' },
    { id: 'hangul', label: 'Hangul' },
] as const

type Tab = (typeof TABS)[number]['id']

export default function LeaderboardPage() {
    const [tab, setTab] = useState<Tab>('daily')
    const [difficulty, setDifficulty] = useState<InfiniteDifficulty>('normal')
    const [imageMode, setImageMode] = useState<ImageMode>('pixelated')
    const [rows, setRows] = useState<Array<{ rank: number; nickname: string; max_streak: number; is_me: boolean }>>([])
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
                    tab === 'infinite' ? imageMode : '',
                )
                if (cancelled) return
                setRows(data.rows ?? [])
                setMe(data.me)
                setError('')
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the leaderboard.')
            }
        }
        void load()
        return () => {
            cancelled = true
        }
    }, [tab, difficulty, imageMode])

    return (
        <main className='mx-auto min-h-screen max-w-lg px-4 py-10'>
            <Link href='/' className='text-sm text-gray-500 underline dark:text-zinc-400'>
                Back to the game
            </Link>
            <h1 className='mt-4 text-3xl font-bold uppercase'>Leaderboard</h1>
            <p className='mt-2 text-sm text-gray-500 dark:text-zinc-400'>
                Highest streak. Guests and accounts without a nickname are left off.
            </p>
            <div className='mt-6 flex rounded-full bg-gray-100 p-1 dark:bg-zinc-800'>
                {TABS.map((item) => (
                    <button
                        key={item.id}
                        type='button'
                        onClick={() => setTab(item.id)}
                        className={`flex-1 cursor-pointer rounded-full py-1.5 text-sm ${
                            tab === item.id ? 'bg-white font-medium dark:bg-zinc-900' : ''
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            {tab === 'infinite' ? (
                <div className='mt-4 flex flex-wrap gap-2'>
                    {DIFFICULTIES.map((option) => (
                        <button
                            key={option}
                            type='button'
                            onClick={() => setDifficulty(option)}
                            className={`cursor-pointer rounded-full px-3 py-1 text-xs ${
                                difficulty === option ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-zinc-800'
                            }`}
                        >
                            {DIFFICULTY_LABELS[option]}
                        </button>
                    ))}
                    {(['pixelated', 'zoom'] as ImageMode[]).map((option) => (
                        <button
                            key={option}
                            type='button'
                            onClick={() => setImageMode(option)}
                            className={`cursor-pointer rounded-full px-3 py-1 text-xs ${
                                imageMode === option ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 dark:bg-zinc-800'
                            }`}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            ) : null}
            {error ? <p className='mt-4 text-sm'>{error}</p> : null}
            <ol className='mt-6 space-y-2'>
                {rows.length === 0 ? (
                    <li className='text-sm text-gray-500'>No ranked streaks yet.</li>
                ) : (
                    rows.map((row) => (
                        <li
                            key={`${row.rank}-${row.nickname}`}
                            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                                row.is_me ? 'bg-amber-50 dark:bg-zinc-800' : 'bg-gray-50 dark:bg-zinc-900'
                            }`}
                        >
                            <span>
                                {row.rank}. {row.nickname}
                            </span>
                            <span className='font-medium'>{row.max_streak}</span>
                        </li>
                    ))
                )}
            </ol>
            {me ? (
                <p className='mt-6 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-zinc-700'>
                    You: {me.nickname ?? 'no nickname'} · best {me.max_streak}
                    {me.rank ? ` · rank ${me.rank}` : ''}
                    {me.is_anonymous || !me.eligible ? ' · sign in and set a nickname to be ranked' : ''}
                </p>
            ) : null}
        </main>
    )
}

