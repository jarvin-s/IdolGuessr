'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import SignInButton from '@/components/auth/SignInButton'
import { getStreaks, saveNickname } from '@/lib/player'

const MODES = [
    { mode: 'daily', label: 'Daily' },
    { mode: 'infinite', label: 'Infinite' },
    { mode: 'hangul', label: 'Hangul' },
] as const

export default function ProfilePage() {
    const { profile, isGuest, signOut } = useAuth()
    const streaks = getStreaks()
    const [nickname, setNickname] = useState(profile?.nickname ?? '')
    const [message, setMessage] = useState('')
    const [saving, setSaving] = useState(false)

    const daily = streaks.find((row) => row.mode === 'daily')
    const winRate =
        daily && daily.total_games > 0
            ? Math.round((daily.total_wins / daily.total_games) * 100)
            : 0

    const save = async () => {
        setSaving(true)
        setMessage('')
        try {
            await saveNickname(nickname.trim())
            setMessage('Nickname saved.')
        } catch (error) {
            const text = error instanceof Error ? error.message : 'Could not save that nickname.'
            setMessage(text.replaceAll('_', ' '))
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className='mx-auto min-h-screen max-w-lg px-4 py-10'>
            <Link
                href='/'
                className='inline-flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-100 px-3 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
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
            <h1 className='mt-4 text-3xl font-bold uppercase'>Profile</h1>
            {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={profile.avatar_url}
                    alt=''
                    className='mt-6 h-16 w-16 rounded-full'
                />
            ) : null}
            {isGuest ? (
                <div className='mt-6 rounded-lg border border-gray-200 p-4 dark:border-zinc-700'>
                    <p className='text-sm text-gray-600 dark:text-zinc-400'>
                        You are playing as a guest. Sign in with Google to keep your progress and choose a nickname.
                    </p>
                    <div className='mt-3'>
                        <SignInButton />
                    </div>
                </div>
            ) : (
                <div className='mt-6'>
                    <label className='text-sm text-gray-600 dark:text-zinc-400' htmlFor='nickname'>
                        Nickname
                    </label>
                    <div className='mt-2 flex gap-2'>
                        <input
                            id='nickname'
                            value={nickname}
                            onChange={(event) => setNickname(event.target.value)}
                            maxLength={20}
                            className='flex-1 rounded-lg border border-gray-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900'
                        />
                        <button
                            type='button'
                            disabled={saving}
                            onClick={() => void save()}
                            className='cursor-pointer rounded-lg bg-black px-4 py-2 text-white dark:bg-white dark:text-black'
                        >
                            Save
                        </button>
                    </div>
                    <p className='mt-2 text-xs text-gray-500 dark:text-zinc-400'>
                        3–20 letters, numbers, or underscores. You can change it once every 7 days.
                    </p>
                    {message ? <p className='mt-2 text-sm'>{message}</p> : null}
                </div>
            )}

            <h2 className='mt-8 text-xl font-bold uppercase'>Streaks</h2>
            <p className='mt-1 text-sm text-gray-500 dark:text-zinc-400'>
                Daily win rate {winRate}%. Imported streaks from this browser are kept on your profile and are not ranked.
            </p>
            <ul className='mt-4 space-y-2'>
                {MODES.map((item) => {
                    const rows = streaks.filter((row) => row.mode === item.mode)
                    if (rows.length === 0) {
                        return (
                            <li key={item.mode} className='rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-zinc-700'>
                                {item.label}: no games yet
                            </li>
                        )
                    }
                    return rows.map((row) => (
                        <li
                            key={`${row.mode}-${row.difficulty}-${row.image_mode}`}
                            className='rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-zinc-700'
                        >
                            <span className='font-medium'>{item.label}</span>
                            {row.difficulty ? ` · ${row.difficulty}` : ''}
                            {row.image_mode ? ` · ${row.image_mode}` : ''}
                            {': '}
                            {row.current_streak} current, {row.max_streak} best
                            {row.imported_max_streak > 0 ? ` (imported ${row.imported_max_streak})` : ''}
                        </li>
                    ))
                })}
            </ul>
            {daily ? (
                <div className='mt-6'>
                    <h2 className='text-xl font-bold uppercase'>Daily guesses</h2>
                    <ul className='mt-2 grid grid-cols-6 gap-2 text-center text-sm'>
                        {[1, 2, 3, 4, 5, 6].map((count) => (
                            <li key={count} className='rounded bg-gray-100 py-2 dark:bg-zinc-800'>
                                <div className='font-bold'>{daily.guess_distribution?.[String(count)] ?? 0}</div>
                                <div className='text-xs text-gray-500'>{count}</div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}
            <div className='mt-8 flex gap-4'>
                <Link href='/leaderboard' className='text-sm underline'>
                    Leaderboard
                </Link>
                {!isGuest ? (
                    <button type='button' onClick={() => void signOut()} className='text-sm underline'>
                        Sign out
                    </button>
                ) : null}
            </div>
        </main>
    )
}
