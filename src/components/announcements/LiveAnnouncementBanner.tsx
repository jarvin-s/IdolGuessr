'use client'

import { useEffect, useState } from 'react'
import { useLiveAnnouncement } from '@/hooks/useLiveAnnouncement'

export default function LiveAnnouncementBanner() {
    const announcement = useLiveAnnouncement()
    const [dismissedKey, setDismissedKey] = useState<string | null>(null)

    const id = announcement?.id
    const updatedAt = announcement?.updated_at
    const displaySeconds = announcement?.display_seconds
    const hideKey = id ? `${id}:${updatedAt}` : null

    useEffect(() => {
        if (!id || displaySeconds == null) return
        const key = `${id}:${updatedAt}`
        const timer = window.setTimeout(
            () => setDismissedKey(key),
            displaySeconds * 1000
        )
        return () => window.clearTimeout(timer)
    }, [id, updatedAt, displaySeconds])

    if (!announcement || !hideKey || dismissedKey === hideKey) return null

    return (
        <div className='pointer-events-none fixed inset-x-0 top-3 z-[250] flex justify-center px-3 sm:justify-end sm:px-4'>
            <div className='pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border-l-4 border-pink-500 bg-white p-3 shadow-lg dark:bg-zinc-900'>
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center mb-1'>
                        <span className='font-semibold text-xs text-pink-600 dark:text-pink-400 tracking-wide'>
                            IdolGuessr - CREATOR
                        </span>
                    </div>
                    <p className='min-w-0 flex-1 text-sm leading-relaxed break-words whitespace-pre-wrap'>
                        {announcement.message}
                    </p>
                </div>
                <button
                    type='button'
                    onClick={() => setDismissedKey(hideKey)}
                    className='flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                    aria-label='Close announcement'
                >
                    <svg
                        className='h-3.5 w-3.5 text-gray-600 dark:text-zinc-400'
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
            </div>
        </div>
    )
}
