'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import SignInButton from '@/components/auth/SignInButton'
import { getStreaks, saveNickname, type StreakRow } from '@/lib/player'
import {
    DIFFICULTY_LABELS,
    IMAGE_MODE_LABELS,
    type ImageMode,
    type InfiniteDifficulty,
} from '@/utils/difficulty'

const MODES = [
    { mode: 'daily', label: 'Daily' },
    { mode: 'infinite', label: 'Infinite' },
    { mode: 'hangul', label: 'Hangul' },
] as const

type GameMode = (typeof MODES)[number]['mode']

const NICKNAME_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000

function nicknameAvailableAt(
    changedAt: string | null | undefined
): Date | null {
    if (!changedAt) return null
    const changed = new Date(changedAt)
    if (Number.isNaN(changed.getTime())) return null
    return new Date(changed.getTime() + NICKNAME_COOLDOWN_MS)
}

function rowTitle(row: StreakRow): string {
    const parts: string[] = []
    if (row.difficulty && row.difficulty in DIFFICULTY_LABELS) {
        parts.push(DIFFICULTY_LABELS[row.difficulty as InfiniteDifficulty])
    }
    if (row.image_mode && row.image_mode in IMAGE_MODE_LABELS) {
        parts.push(IMAGE_MODE_LABELS[row.image_mode as ImageMode])
    }
    return parts.join(' · ')
}

function winRate(row: StreakRow): number {
    if (row.total_games <= 0) return 0
    return Math.round((row.total_wins / row.total_games) * 100)
}

export default function ProfilePage() {
    const { profile, isGuest, signOut } = useAuth()
    const streaks = getStreaks()
    const [mode, setMode] = useState<GameMode>('daily')
    const [nickname, setNickname] = useState(profile?.nickname ?? '')
    const [message, setMessage] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        setNickname(profile?.nickname ?? '')
    }, [profile?.nickname])

    const availableAt = nicknameAvailableAt(profile?.nickname_changed_at)
    const nicknameLocked =
        availableAt !== null && availableAt.getTime() > Date.now()
    const modeRows = streaks.filter((row) => row.mode === mode)
    const singleRow = modeRows.length === 1 ? modeRows[0] : null

    const save = async () => {
        if (nicknameLocked) return
        setSaving(true)
        setMessage('')
        try {
            await saveNickname(nickname.trim())
            setMessage('Nickname saved.')
        } catch (error) {
            const text =
                error instanceof Error
                    ? error.message
                    : 'Could not save that nickname.'
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
                        You are playing as a guest. Sign in with Google to keep
                        your progress and choose a nickname.
                    </p>
                    <div className='mt-3'>
                        <SignInButton />
                    </div>
                </div>
            ) : (
                <div className='mt-6'>
                    <label
                        className='text-sm text-gray-600 dark:text-zinc-400'
                        htmlFor='nickname'
                    >
                        Nickname
                    </label>
                    <div className='mt-2 flex gap-2'>
                        <input
                            id='nickname'
                            value={nickname}
                            onChange={(event) =>
                                setNickname(event.target.value)
                            }
                            maxLength={20}
                            disabled={nicknameLocked}
                            className='flex-1 rounded-lg border border-gray-300 px-3 py-2 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-zinc-700 dark:bg-zinc-900 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-500'
                        />
                        <button
                            type='button'
                            disabled={saving || nicknameLocked}
                            onClick={() => void save()}
                            className='cursor-pointer rounded-lg bg-black px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black'
                        >
                            Save
                        </button>
                    </div>
                    <p className='mt-2 text-xs text-gray-500 dark:text-zinc-400'>
                        {nicknameLocked && availableAt
                            ? `You can change it again on ${availableAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
                            : '3–20 letters, numbers, or underscores. You can change it once every 7 days.'}
                    </p>
                    {message ? <p className='mt-2 text-sm'>{message}</p> : null}
                </div>
            )}

            <h2 className='mt-8 text-xl font-bold uppercase'>Streaks</h2>
            <p className='mt-1 text-sm text-gray-500 dark:text-zinc-400'>
                Imported streaks from this browser stay on your profile and are
                not ranked.
            </p>
            <div className='mt-4 flex rounded-full bg-gray-100 p-1 dark:bg-zinc-800'>
                {MODES.map((item) => (
                    <button
                        key={item.mode}
                        type='button'
                        onClick={() => setMode(item.mode)}
                        className={`flex-1 cursor-pointer rounded-full py-1.5 text-sm ${
                            mode === item.mode
                                ? 'bg-white font-medium dark:bg-zinc-900'
                                : ''
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
            {modeRows.length === 0 ? (
                <p className='mt-4 text-sm text-gray-500 dark:text-zinc-400'>
                    No games yet.
                </p>
            ) : (
                <ul className='mt-4 space-y-2'>
                    {modeRows.map((row) => {
                        const title = rowTitle(row)
                        return (
                            <li
                                key={`${row.mode}-${row.difficulty}-${row.image_mode}`}
                                className='rounded-lg border border-gray-200 px-3 py-3 text-sm dark:border-zinc-700'
                            >
                                {title ? (
                                    <p className='font-medium'>{title}</p>
                                ) : null}
                                <div
                                    className={`grid grid-cols-3 gap-2 text-center ${title ? 'mt-2' : ''}`}
                                >
                                    <div>
                                        <div className='text-lg font-bold'>
                                            {row.current_streak}
                                        </div>
                                        <div className='text-xs text-gray-500 dark:text-zinc-400'>
                                            Current
                                        </div>
                                    </div>
                                    <div>
                                        <div className='text-lg font-bold'>
                                            {row.max_streak}
                                        </div>
                                        <div className='text-xs text-gray-500 dark:text-zinc-400'>
                                            Best
                                        </div>
                                    </div>
                                    <div>
                                        <div className='text-lg font-bold'>
                                            {winRate(row)}%
                                        </div>
                                        <div className='text-xs text-gray-500 dark:text-zinc-400'>
                                            Wins
                                        </div>
                                    </div>
                                </div>
                                {row.imported_max_streak > 0 ? (
                                    <p className='mt-2 text-xs text-gray-500 dark:text-zinc-400'>
                                        Imported best {row.imported_max_streak}
                                    </p>
                                ) : null}
                            </li>
                        )
                    })}
                </ul>
            )}
            {singleRow ? (
                <div className='mt-6'>
                    <h2 className='text-xl font-bold uppercase'>Guesses</h2>
                    <ul className='mt-2 grid grid-cols-6 gap-2 text-center text-sm'>
                        {[1, 2, 3, 4, 5, 6].map((count) => (
                            <li
                                key={count}
                                className='rounded bg-gray-100 py-2 dark:bg-zinc-800'
                            >
                                <div className='font-bold'>
                                    {singleRow.guess_distribution?.[
                                        String(count)
                                    ] ?? 0}
                                </div>
                                <div className='text-xs text-gray-500'>
                                    {count}
                                </div>
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
                    <button
                        type='button'
                        onClick={() => void signOut()}
                        className='text-sm underline'
                    >
                        Sign out
                    </button>
                ) : null}
            </div>
        </main>
    )
}
