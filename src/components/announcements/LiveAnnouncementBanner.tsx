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
        <div className="pointer-events-none fixed inset-x-0 top-4 z-[260] flex justify-center px-3">
            <div
                className="pointer-events-auto flex w-full max-w-2xl items-start gap-5 rounded-xl border-2 border-pink-600 bg-gradient-to-r from-pink-50 via-white to-pink-100 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900 p-5 shadow-2xl ring-2 ring-pink-400/10 animate-pop">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                        <span className="font-extrabold text-base tracking-wide text-pink-700 dark:text-pink-700 drop-shadow-lg">
                            IdolGuessr - CREATOR
                        </span>
                    </div>
                    <p className="min-w-0 flex-1 text-lg leading-relaxed font-medium text-zinc-800 dark:text-zinc-100 break-words whitespace-pre-wrap drop-shadow-sm">
                        {announcement.message}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setDismissedKey(hideKey)}
                    className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-pink-100 transition-colors hover:bg-pink-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-pink-200 dark:border-zinc-700 shadow"
                    aria-label="Close announcement"
                >
                    <svg
                        className="h-4 w-4 text-pink-600 dark:text-pink-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>
            </div>
            <style jsx global>{`
                @keyframes pop {
                    0% { transform: scale(0.96) translateY(-24px); opacity: 0.3; }
                    80% { transform: scale(1.04) translateY(2px); opacity: 1;}
                    100% { transform: scale(1) translateY(0); opacity: 1;}
                }
                .animate-pop {
                    animation: pop 0.33s cubic-bezier(.43,1.3,.46,1) both;
                }
            `}</style>
        </div>
    )
}
