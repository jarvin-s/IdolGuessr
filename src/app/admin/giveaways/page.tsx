'use client'

import { useCallback, useEffect, useState } from 'react'
import {
    adminCloseGiveaway,
    adminDrawGiveaway,
    adminFulfillGiveaway,
    adminListEntries,
    adminListGiveaways,
    adminOpenGiveaway,
    adminSetGiveawayEndsAt,
    giveawayProfileUrl,
    type GiveawayEntry,
    type GiveawayRound,
    type GiveawayStatus,
} from '@/lib/supabase'

const STATUS_LABEL: Record<GiveawayStatus, string> = {
    open: 'Open',
    closed: 'Closed',
    drawn: 'Winner drawn',
    fulfilled: 'Fulfilled',
}

function actionError(err: unknown, fallback: string): string {
    const message = err instanceof Error ? err.message : ''
    if (
        message.includes('already open') ||
        message.includes('not open') ||
        message.includes('before drawing') ||
        message.includes('already fulfilled') ||
        message.includes('No entries') ||
        message.includes('not found') ||
        message.includes('Not authorized') ||
        message.includes('Idol name') ||
        message.includes('Play date') ||
        message.includes('Draw a winner') ||
        message.includes('Title is required') ||
        message.includes('End time')
    ) {
        return message
    }
    return fallback
}

export default function AdminGiveawaysPage() {
    const [title, setTitle] = useState('')
    const [endsAt, setEndsAt] = useState('')
    const [rounds, setRounds] = useState<GiveawayRound[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isOpening, setIsOpening] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const loadRounds = useCallback(async () => {
        try {
            setRounds(await adminListGiveaways())
            setError(null)
        } catch (err) {
            console.error('Error loading giveaways:', err)
            setError('Could not load giveaways.')
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        loadRounds()
    }, [loadRounds])

    const hasOpenRound = rounds.some((round) => round.status === 'open')
    const trimmed = title.trim()

    const openRound = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!trimmed || !endsAt) return
        setIsOpening(true)
        setError(null)
        try {
            await adminOpenGiveaway(trimmed, endsAt)
            setTitle('')
            setEndsAt('')
            await loadRounds()
        } catch (err) {
            console.error('Error opening giveaway:', err)
            setError(actionError(err, 'Could not open this giveaway.'))
        } finally {
            setIsOpening(false)
        }
    }

    return (
        <div className='space-y-4'>
            <form
                onSubmit={openRound}
                className='space-y-4 rounded-lg bg-white p-4 shadow-sm sm:p-6 dark:bg-zinc-900'
            >
                <label className='block'>
                    <span className='mb-2 block text-base text-gray-600 dark:text-zinc-400'>
                        New giveaway
                    </span>
                    <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder='Daily idol giveaway'
                        disabled={hasOpenRound}
                        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-300'
                    />
                </label>
                <label className='block'>
                    <span className='mb-2 block text-base text-gray-600 dark:text-zinc-400'>
                        Sign-ups end
                    </span>
                    <input
                        type='datetime-local'
                        value={endsAt}
                        onChange={(event) => setEndsAt(event.target.value)}
                        disabled={hasOpenRound}
                        className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-300'
                    />
                </label>
                {hasOpenRound && (
                    <p className='text-base text-gray-500 dark:text-zinc-400'>
                        Close the open giveaway before starting another one.
                    </p>
                )}
                {error && <p className='text-base text-red-600'>{error}</p>}
                <button
                    type='submit'
                    disabled={isOpening || hasOpenRound || trimmed.length === 0 || endsAt.length === 0}
                    className='cursor-pointer rounded-full bg-pink-500 px-4 py-2 text-lg font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
                >
                    {isOpening ? 'Opening...' : 'Open giveaway'}
                </button>
            </form>

            <section className='rounded-lg bg-white p-4 shadow-sm sm:p-6 dark:bg-zinc-900'>
                <h2 className='text-base text-gray-600 dark:text-zinc-400'>Rounds</h2>
                {isLoading ? (
                    <p className='mt-3 text-base text-gray-500 dark:text-zinc-400'>
                        Loading...
                    </p>
                ) : rounds.length === 0 ? (
                    <p className='mt-3 text-base text-gray-500 dark:text-zinc-400'>
                        No giveaways yet.
                    </p>
                ) : (
                    <ul className='mt-3 space-y-4'>
                        {rounds.map((round) => (
                            <GiveawayRoundCard
                                key={round.id}
                                round={round}
                                onChanged={loadRounds}
                            />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}

function GiveawayRoundCard({
    round,
    onChanged,
}: {
    round: GiveawayRound
    onChanged: () => Promise<void>
}) {
    const [pending, setPending] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showEntries, setShowEntries] = useState(false)
    const [entries, setEntries] = useState<GiveawayEntry[] | null>(null)
    const [idol, setIdol] = useState(round.chosen_idol ?? '')
    const [playDate, setPlayDate] = useState(round.target_play_date ?? '')
    const [endsAt, setEndsAt] = useState(toDatetimeLocal(round.ends_at))
    const [creditNote, setCreditNote] = useState<string | null>(null)

    useEffect(() => {
        setEndsAt(toDatetimeLocal(round.ends_at))
    }, [round.ends_at])

    const saveEnd = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!endsAt) return
        setPending('ends')
        setError(null)
        try {
            await adminSetGiveawayEndsAt(round.id, endsAt)
            await onChanged()
        } catch (err) {
            console.error('Error saving giveaway end time:', err)
            setError(actionError(err, 'Could not save this end time.'))
        } finally {
            setPending(null)
        }
    }

    const run = async (name: string, action: () => Promise<void>) => {
        setPending(name)
        setError(null)
        setCreditNote(null)
        try {
            await action()
            await onChanged()
        } catch (err) {
            console.error(`Error during ${name}:`, err)
            setError(actionError(err, 'That did not work. Try again.'))
        } finally {
            setPending(null)
        }
    }

    const toggleEntries = async () => {
        if (showEntries) {
            setShowEntries(false)
            return
        }
        setShowEntries(true)
        if (entries) return
        setPending('entries')
        setError(null)
        try {
            setEntries(await adminListEntries(round.id))
        } catch (err) {
            console.error('Error loading entries:', err)
            setError('Could not load entries.')
            setShowEntries(false)
        } finally {
            setPending(null)
        }
    }

    const fulfill = async (event: React.FormEvent) => {
        event.preventDefault()
        if (!idol.trim() || !playDate) return
        setPending('fulfill')
        setError(null)
        setCreditNote(null)
        try {
            const credited = await adminFulfillGiveaway(round.id, idol.trim(), playDate)
            setCreditNote(
                credited
                    ? "Saved. That day's image is credited to the winner."
                    : 'Saved. No daily is scheduled for that date yet, so submit again after you add it.'
            )
            await onChanged()
        } catch (err) {
            console.error('Error fulfilling giveaway:', err)
            setError(actionError(err, 'Could not save this pick.'))
        } finally {
            setPending(null)
        }
    }

    const canDraw = round.status === 'closed' || round.status === 'drawn'
    const canFulfill = round.status === 'drawn' || round.status === 'fulfilled'

    return (
        <li className='border-t border-gray-100 pt-4 first:border-t-0 first:pt-0 dark:border-zinc-800'>
            <div className='flex flex-wrap items-start justify-between gap-2'>
                <div>
                    <p className='text-lg font-medium'>{round.title}</p>
                    <p className='mt-1 text-sm text-gray-500 dark:text-zinc-400'>
                        {round.entry_count === 1
                            ? '1 entry'
                            : `${round.entry_count} entries`}
                    </p>
                </div>
                <span className='rounded-full bg-pink-500 px-2.5 py-1 text-sm text-white'>
                    {STATUS_LABEL[round.status]}
                </span>
            </div>

            {round.winner && (
                <p className='mt-2 text-xl'>
                    Winner:{' '}
                    <a
                        href={giveawayProfileUrl(round.winner.platform, round.winner.handle)}
                        target='_blank'
                        rel='noreferrer'
                        className='text-pink-600 underline dark:text-pink-400'
                    >
                        @{round.winner.handle}
                    </a>{' '}
                    <span className='text-gray-500 dark:text-zinc-400'>
                        ({round.winner.platform === 'instagram' ? 'Instagram' : 'TikTok'})
                    </span>
                </p>
            )}

            {round.status === 'open' && !round.ends_at && (
                <form onSubmit={saveEnd} className='mt-3 space-y-2'>
                    <label className='block'>
                        <span className='mb-2 block text-sm text-gray-500 dark:text-zinc-400'>
                            Sign-ups end
                        </span>
                        <input
                            type='datetime-local'
                            value={endsAt}
                            onChange={(event) => setEndsAt(event.target.value)}
                            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg dark:border-zinc-600 dark:bg-zinc-800'
                        />
                    </label>
                    <button
                        type='submit'
                        disabled={pending !== null || endsAt.length === 0}
                        className='cursor-pointer rounded-full bg-pink-500 px-3 py-1.5 text-base font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
                    >
                        {pending === 'ends' ? 'Saving...' : 'Save end time'}
                    </button>
                </form>
            )}

            <div className='mt-3 flex flex-wrap gap-2'>
                {round.status === 'open' && (
                    <button
                        type='button'
                        disabled={pending !== null}
                        onClick={() => run('close', () => adminCloseGiveaway(round.id))}
                        className='cursor-pointer rounded-full bg-gray-200 px-3 py-1.5 text-base text-gray-700 transition-colors hover:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-600'
                    >
                        {pending === 'close' ? 'Closing...' : 'Close entries'}
                    </button>
                )}
                {canDraw && (
                    <button
                        type='button'
                        disabled={pending !== null || round.entry_count === 0}
                        onClick={() =>
                            run('draw', async () => {
                                await adminDrawGiveaway(round.id)
                            })
                        }
                        className='cursor-pointer rounded-full bg-pink-500 px-3 py-1.5 text-base text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
                    >
                        {pending === 'draw'
                            ? 'Drawing...'
                            : round.status === 'drawn'
                              ? 'Redraw'
                              : 'Draw winner'}
                    </button>
                )}
                <button
                    type='button'
                    disabled={pending !== null}
                    onClick={toggleEntries}
                    className='cursor-pointer rounded-full bg-gray-100 px-3 py-1.5 text-base transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                >
                    {pending === 'entries'
                        ? 'Loading...'
                        : showEntries
                          ? 'Hide entries'
                          : 'Show entries'}
                </button>
            </div>

            {showEntries && entries && (
                <ul className='mt-3 space-y-2'>
                    {entries.length === 0 ? (
                        <li className='text-base text-gray-500 dark:text-zinc-400'>
                            No entries yet.
                        </li>
                    ) : (
                        entries.map((entry) => (
                            <li key={entry.id} className='text-base'>
                                <a
                                    href={giveawayProfileUrl(entry.platform, entry.handle)}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='text-pink-600 underline dark:text-pink-400'
                                >
                                    @{entry.handle}
                                </a>{' '}
                                <span className='text-gray-500 dark:text-zinc-400'>
                                    {entry.platform === 'instagram' ? 'Instagram' : 'TikTok'}
                                </span>
                            </li>
                        ))
                    )}
                </ul>
            )}

            {canFulfill && (
                <form onSubmit={fulfill} className='mt-4 space-y-3'>
                    <p className='text-sm text-gray-500 dark:text-zinc-400'>
                        Message the winner, then record the idol they picked and the day
                        it should run. If that day&apos;s image is already scheduled, they
                        are credited on it.
                    </p>
                    <div className='grid gap-3 sm:grid-cols-2'>
                        <input
                            value={idol}
                            onChange={(event) => setIdol(event.target.value)}
                            placeholder='Idol name'
                            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-300'
                        />
                        <input
                            type='date'
                            value={playDate}
                            onChange={(event) => setPlayDate(event.target.value)}
                            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-lg dark:border-zinc-600 dark:bg-zinc-800'
                        />
                    </div>
                    <button
                        type='submit'
                        disabled={pending !== null || idol.trim().length === 0 || !playDate}
                        className='cursor-pointer rounded-full bg-pink-500 px-4 py-2 text-base font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
                    >
                        {pending === 'fulfill' ? 'Saving...' : 'Save pick'}
                    </button>
                    {creditNote && (
                        <p className='text-base text-gray-700 dark:text-zinc-300'>{creditNote}</p>
                    )}
                </form>
            )}

            {error && <p className='mt-3 text-base text-red-600'>{error}</p>}
        </li>
    )
}

function toDatetimeLocal(iso: string | null): string {
    if (!iso) return ''
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return ''
    const pad = (value: number) => String(value).padStart(2, '0')
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}
