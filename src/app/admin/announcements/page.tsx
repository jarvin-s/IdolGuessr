'use client'

import { useCallback, useEffect, useState } from 'react'
import {
    adminActivateAnnouncement,
    adminClearAnnouncement,
    adminListAnnouncements,
    adminPublishAnnouncement,
    supabase,
    type Announcement,
} from '@/lib/supabase'

const DURATION_OPTIONS: {
    value: string
    label: string
    seconds: number | null
}[] = [
    { value: '5', label: '5 seconds', seconds: 5 },
    { value: '10', label: '10 seconds', seconds: 10 },
    { value: '30', label: '30 seconds', seconds: 30 },
    { value: '60', label: '60 seconds', seconds: 60 },
    { value: 'until-closed', label: 'Until closed', seconds: null },
]

const MAX_MESSAGE_LENGTH = 280

function formatDuration(seconds: number | null): string {
    if (seconds == null) return 'Until closed'
    return `${seconds} seconds`
}

export default function AdminAnnouncementsPage() {
    const [message, setMessage] = useState('')
    const [duration, setDuration] = useState('until-closed')
    const [announcements, setAnnouncements] = useState<Announcement[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isPublishing, setIsPublishing] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [pendingId, setPendingId] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const loadAnnouncements = useCallback(async () => {
        try {
            setAnnouncements(await adminListAnnouncements())
            setError(null)
        } catch (err) {
            console.error('Error loading announcements:', err)
            setError('Could not load announcements.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadAnnouncements()
        const channel = supabase
            .channel('admin-announcements')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'announcements' },
                () => {
                    loadAnnouncements()
                }
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadAnnouncements])

    const active = announcements.find((item) => item.is_active) ?? null
    const trimmed = message.trim()
    const selectedDuration =
        DURATION_OPTIONS.find((option) => option.value === duration) ??
        DURATION_OPTIONS[4]

    const publish = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!trimmed || trimmed.length > MAX_MESSAGE_LENGTH) return
        setIsPublishing(true)
        setError(null)
        try {
            await adminPublishAnnouncement(trimmed, selectedDuration.seconds)
            setMessage('')
            await loadAnnouncements()
        } catch (err) {
            console.error('Error publishing announcement:', err)
            setError('Could not publish this announcement.')
        } finally {
            setIsPublishing(false)
        }
    }

    const clearActive = async () => {
        setIsClearing(true)
        setError(null)
        try {
            await adminClearAnnouncement()
            await loadAnnouncements()
        } catch (err) {
            console.error('Error clearing announcement:', err)
            setError('Could not clear the announcement.')
        } finally {
            setIsClearing(false)
        }
    }

    const republish = async (id: string) => {
        setPendingId(id)
        setError(null)
        try {
            await adminActivateAnnouncement(id)
            await loadAnnouncements()
        } catch (err) {
            console.error('Error republishing announcement:', err)
            setError('Could not publish this announcement again.')
        } finally {
            setPendingId(null)
        }
    }

    return (
        <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]'>
            <form
                onSubmit={publish}
                className='space-y-4 rounded-lg bg-white p-4 shadow-sm sm:p-6 dark:bg-zinc-900'
            >
                <label className='block'>
                    <span className='mb-2 block text-sm text-gray-600 dark:text-zinc-400'>
                        Message
                    </span>
                    <textarea
                        value={message}
                        onChange={(event) =>
                            setMessage(
                                event.target.value.slice(0, MAX_MESSAGE_LENGTH)
                            )
                        }
                        rows={5}
                        placeholder='Write a short update for people currently on the site'
                        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-300'
                    />
                    <span className='mt-1 block text-right text-xs text-gray-500 dark:text-zinc-400'>
                        {message.length}/{MAX_MESSAGE_LENGTH}
                    </span>
                </label>
                <label className='block'>
                    <span className='mb-2 block text-sm text-gray-600 dark:text-zinc-400'>
                        Show for
                    </span>
                    <select
                        value={duration}
                        onChange={(event) => setDuration(event.target.value)}
                        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base dark:border-zinc-600 dark:bg-zinc-800'
                    >
                        {DURATION_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </label>
                {error && <p className='text-sm text-red-600'>{error}</p>}
                <button
                    type='submit'
                    disabled={isPublishing || trimmed.length === 0}
                    className='cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
                >
                    {isPublishing ? 'Publishing...' : 'Publish'}
                </button>
            </form>

            <div className='space-y-4'>
                <section className='rounded-lg bg-white p-4 shadow-sm sm:p-6 dark:bg-zinc-900'>
                    <h2 className='text-sm text-gray-600 dark:text-zinc-400'>
                        Active now
                    </h2>
                    {isLoading ? (
                        <p className='mt-3 text-sm text-gray-500 dark:text-zinc-400'>
                            Loading...
                        </p>
                    ) : active ? (
                        <>
                            <p className='mt-3 text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                {active.message}
                            </p>
                            <p className='mt-2 text-xs text-gray-500 dark:text-zinc-400'>
                                Shows for{' '}
                                {formatDuration(active.display_seconds)}
                            </p>
                            <button
                                type='button'
                                onClick={clearActive}
                                disabled={isClearing}
                                className='mt-4 cursor-pointer rounded-full bg-gray-200 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-600'
                            >
                                {isClearing ? 'Clearing...' : 'Clear'}
                            </button>
                        </>
                    ) : (
                        <p className='mt-3 text-sm text-gray-500 dark:text-zinc-400'>
                            No announcement is live.
                        </p>
                    )}
                </section>

                <section className='rounded-lg bg-white p-4 shadow-sm sm:p-6 dark:bg-zinc-900'>
                    <h2 className='text-sm text-gray-600 dark:text-zinc-400'>
                        Recent
                    </h2>
                    {isLoading ? (
                        <p className='mt-3 text-sm text-gray-500 dark:text-zinc-400'>
                            Loading...
                        </p>
                    ) : announcements.length === 0 ? (
                        <p className='mt-3 text-sm text-gray-500 dark:text-zinc-400'>
                            Nothing published yet.
                        </p>
                    ) : (
                        <ul className='mt-3 space-y-3'>
                            {announcements.map((item) => (
                                <li
                                    key={item.id}
                                    className='border-t border-gray-100 pt-3 first:border-t-0 first:pt-0 dark:border-zinc-800'
                                >
                                    <p className='text-sm leading-relaxed break-words whitespace-pre-wrap'>
                                        {item.message}
                                    </p>
                                    <div className='mt-2 flex flex-wrap items-center gap-2'>
                                        <span className='text-xs text-gray-500 dark:text-zinc-400'>
                                            {formatDuration(
                                                item.display_seconds
                                            )}
                                        </span>
                                        {item.is_active ? (
                                            <span className='rounded-full bg-pink-500 px-2 py-0.5 text-xs text-white'>
                                                Active
                                            </span>
                                        ) : (
                                            <button
                                                type='button'
                                                onClick={() =>
                                                    republish(item.id)
                                                }
                                                disabled={pendingId === item.id}
                                                className='cursor-pointer rounded-full bg-gray-100 px-3 py-1 text-xs transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                                            >
                                                {pendingId === item.id
                                                    ? 'Publishing...'
                                                    : 'Publish again'}
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    )
}
