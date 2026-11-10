'use client'

import { useMemo, useState } from 'react'
import type { UnshuffledArtist } from '@/lib/unshuffled'

interface UnshuffledGroupFilterModalProps {
    open: boolean
    artists: UnshuffledArtist[]
    selected: string[]
    onClose: () => void
    onConfirm: (groups: string[]) => void
}

export default function UnshuffledGroupFilterModal(
    props: UnshuffledGroupFilterModalProps
) {
    if (!props.open) return null
    return <GroupFilterDialog {...props} />
}

function GroupFilterDialog({
    artists,
    selected,
    onClose,
    onConfirm,
}: UnshuffledGroupFilterModalProps) {
    const names = useMemo(() => artists.map((artist) => artist.name), [artists])
    const [draft, setDraft] = useState<Set<string>>(() => {
        const known = selected.filter((name) => names.includes(name))
        return new Set(known.length > 0 ? known : names)
    })
    const [query, setQuery] = useState('')

    const visible = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return artists
        return artists.filter((artist) =>
            artist.name.toLowerCase().includes(needle)
        )
    }, [artists, query])

    const allSelected = draft.size === names.length
    const songCount = artists.reduce(
        (total, artist) => total + (draft.has(artist.name) ? artist.songCount : 0),
        0
    )

    function toggle(name: string) {
        setDraft((current) => {
            const next = new Set(current)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })
    }

    function confirm() {
        if (draft.size === 0) return
        onConfirm(allSelected ? [] : names.filter((name) => draft.has(name)))
    }

    return (
        <div className='fixed inset-0 z-[600] overflow-y-auto bg-black/40 p-4'>
            <div className='flex min-h-full items-center justify-center'>
                <div
                    className='modal-fade-in relative w-full max-w-sm rounded-md bg-white p-8 dark:bg-zinc-900'
                    role='dialog'
                    aria-modal='true'
                    aria-labelledby='unshuffled-groups-title'
                >
                    <button
                        type='button'
                        onClick={onClose}
                        className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        aria-label='Close'
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
                                d='M6 18L18 6M6 6l12 12'
                            />
                        </svg>
                    </button>

                    <h2
                        id='unshuffled-groups-title'
                        className='mb-1 text-center text-xl font-bold uppercase md:text-2xl'
                    >
                        Groups
                    </h2>
                    <p className='mb-4 text-center text-sm text-gray-500 dark:text-zinc-400'>
                        Only play songs from groups you know.
                    </p>

                    <input
                        type='search'
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder='Search groups'
                        className='w-full border-2 border-gray-200 bg-white px-3 py-2 font-medium outline-none focus:border-gray-400 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-500'
                    />

                    <div className='mt-2 flex items-center justify-between text-sm'>
                        <button
                            type='button'
                            onClick={() => setDraft(new Set(names))}
                            disabled={allSelected}
                            className='cursor-pointer font-medium text-pink-600 disabled:cursor-default disabled:opacity-40 dark:text-pink-400'
                        >
                            Select all
                        </button>
                        <span className='text-gray-500 dark:text-zinc-400'>
                            {draft.size} of {names.length} selected
                        </span>
                        <button
                            type='button'
                            onClick={() => setDraft(new Set())}
                            disabled={draft.size === 0}
                            className='cursor-pointer font-medium text-pink-600 disabled:cursor-default disabled:opacity-40 dark:text-pink-400'
                        >
                            Clear
                        </button>
                    </div>

                    <div className='mt-2 max-h-72 overflow-y-auto border-2 border-gray-200 dark:border-zinc-700'>
                        {artists.length === 0 && (
                            <p className='px-3 py-4 text-center text-sm text-gray-500 dark:text-zinc-400'>
                                Could not load the groups.
                            </p>
                        )}
                        {artists.length > 0 && visible.length === 0 && (
                            <p className='px-3 py-4 text-center text-sm text-gray-500 dark:text-zinc-400'>
                                No groups match &quot;{query.trim()}&quot;.
                            </p>
                        )}
                        {visible.map((artist) => {
                            const checked = draft.has(artist.name)
                            return (
                                <button
                                    key={artist.name}
                                    type='button'
                                    role='checkbox'
                                    aria-checked={checked}
                                    onClick={() => toggle(artist.name)}
                                    className='flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left font-medium transition-all hover:bg-gray-50 dark:hover:bg-zinc-800'
                                >
                                    <span
                                        className={`flex h-5 w-5 shrink-0 items-center justify-center border-2 ${
                                            checked
                                                ? 'border-black bg-black dark:border-white dark:bg-white'
                                                : 'border-gray-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
                                        }`}
                                    >
                                        {checked && (
                                            <CheckIcon className='h-3 w-3 text-white dark:text-black' />
                                        )}
                                    </span>
                                    <span className='min-w-0 flex-1 truncate'>
                                        {artist.name}
                                    </span>
                                    <span className='text-xs text-gray-500 dark:text-zinc-400'>
                                        {artist.songCount}{' '}
                                        {artist.songCount === 1
                                            ? 'song'
                                            : 'songs'}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    <p className='mt-2 text-center text-xs text-gray-500 dark:text-zinc-400'>
                        {songCount} {songCount === 1 ? 'song' : 'songs'} in
                        your selection
                    </p>

                    <div className='mt-4 flex justify-center'>
                        <button
                            type='button'
                            onClick={confirm}
                            disabled={draft.size === 0}
                            className='w-full cursor-pointer rounded-full bg-pink-500 px-4 py-1.5 text-white transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50 md:w-[150px]'
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className={className}
            viewBox='0 0 20 20'
            fill='currentColor'
            aria-hidden='true'
        >
            <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
            />
        </svg>
    )
}
