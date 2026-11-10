'use client'

import type { UnshuffledMode } from '@/lib/unshuffled'

interface UnshuffledStartModalProps {
    open: boolean
    mode: UnshuffledMode
    loading: boolean
    error?: string
    groupLabel?: string
    onChooseGroups?: () => void
    onStart: () => void
}

export default function UnshuffledStartModal({
    open,
    mode,
    loading,
    error = '',
    groupLabel,
    onChooseGroups,
    onStart,
}: UnshuffledStartModalProps) {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-[500] flex items-center justify-center bg-black/40 px-4'>
            <div className='w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'>
                <h2 className='text-2xl font-bold'>Unshuffled</h2>
                <ul className='mt-4 space-y-2 text-left text-sm text-gray-600 dark:text-zinc-300'>
                    <li>
                        {mode === 'daily'
                            ? "Today's song has been scrambled."
                            : 'A song has been scrambled.'}
                    </li>
                    <li>Tap a piece to hear it, then drag it into the puzzle.</li>
                    <li>A green square shows where the piece will land.</li>
                    <li>The two corner pieces are already in place.</li>
                    <li>
                        Stuck? Tap Check to see which pieces are right (+10
                        seconds penalty).
                    </li>
                </ul>
                {mode === 'infinite' && onChooseGroups && (
                    <div className='mt-5 text-left'>
                        <span className='mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300'>
                            Groups
                        </span>
                        <button
                            type='button'
                            onClick={onChooseGroups}
                            className='flex w-full cursor-pointer items-center justify-between border-2 border-gray-200 bg-white px-3 py-2 text-left font-medium transition-all hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500'
                        >
                            <span className='truncate'>{groupLabel}</span>
                            <span className='text-sm text-gray-500 dark:text-zinc-400'>
                                Change
                            </span>
                        </button>
                    </div>
                )}
                {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}
                <button
                    type='button'
                    onClick={onStart}
                    disabled={loading || Boolean(error)}
                    className='mt-6 w-full cursor-pointer rounded-full py-3 font-semibold transition-opacity disabled:cursor-default disabled:opacity-50 bg-pink-500 text-white'
                >
                    {loading ? 'Loading…' : 'START'}
                </button>
            </div>
        </div>
    )
}
