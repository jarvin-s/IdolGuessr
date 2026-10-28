'use client'

import { useEffect, useState } from 'react'
import localFont from 'next/font/local'
import {
    enterGiveaway,
    type GiveawayPlatform,
    type OpenGiveaway,
} from '@/lib/supabase'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

const enteredKey = (roundId: string) => `idol-guessr-giveaway-entered-${roundId}`

function entryErrorMessage(err: unknown): string {
    const message = err instanceof Error ? err.message : ''
    if (
        message.includes('already entered') ||
        message.includes('does not look') ||
        message.includes('No giveaway') ||
        message.includes('Pick Instagram')
    ) {
        return message
    }
    return 'Could not enter the giveaway. Try again.'
}

export default function GiveawayModal({
    round,
    onClose,
}: {
    round: OpenGiveaway
    onClose: () => void
}) {
    const [platform, setPlatform] = useState<GiveawayPlatform>('instagram')
    const [handle, setHandle] = useState('')
    const [isEntered, setIsEntered] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        try {
            setIsEntered(localStorage.getItem(enteredKey(round.id)) === '1')
        } catch {
            setIsEntered(false)
        }
    }, [round.id])

    const submit = async (event: React.FormEvent) => {
        event.preventDefault()
        const trimmed = handle.trim()
        if (!trimmed) return
        setIsSubmitting(true)
        setError(null)
        try {
            await enterGiveaway(platform, trimmed)
            localStorage.setItem(enteredKey(round.id), '1')
            setIsEntered(true)
        } catch (err) {
            const message = entryErrorMessage(err)
            if (message.includes('already entered')) {
                try {
                    localStorage.setItem(enteredKey(round.id), '1')
                } catch {
                    // Ignore storage failures; the entry itself succeeded earlier.
                }
                setIsEntered(true)
            } else {
                setError(message)
            }
        } finally {
            setIsSubmitting(false)
        }
    }

    const entryLabel =
        round.entry_count === 1 ? '1 entry' : `${round.entry_count} entries`

    return (
        <div className='fixed inset-0 z-[600] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-900'>
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                    aria-label='Close giveaway'
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

                <h1 className={`${proximaNovaBold.className} pr-10 text-2xl uppercase`}>
                    Daily idol giveaway
                </h1>
                <p className='mt-3 text-sm leading-relaxed text-gray-700 dark:text-zinc-300'>
                    Enter with your Instagram or TikTok. One winner is drawn and gets to
                    choose the idol for a day. We&apos;ll message the winner on the account
                    you enter.
                </p>
                <p className='mt-2 text-sm font-medium'>{round.title}</p>
                <p className='mt-1 text-xs text-gray-500 dark:text-zinc-400'>{entryLabel}</p>

                {isEntered ? (
                    <p className='mt-6 rounded-lg bg-pink-50 px-4 py-3 text-sm text-pink-700 dark:bg-pink-500/10 dark:text-pink-300'>
                        You&apos;re entered. Good luck.
                    </p>
                ) : (
                    <form onSubmit={submit} className='mt-6 space-y-4'>
                        <div className='grid grid-cols-2 gap-2'>
                            <PlatformButton
                                active={platform === 'instagram'}
                                onClick={() => setPlatform('instagram')}
                                label='Instagram'
                            />
                            <PlatformButton
                                active={platform === 'tiktok'}
                                onClick={() => setPlatform('tiktok')}
                                label='TikTok'
                            />
                        </div>
                        <input
                            value={handle}
                            onChange={(event) => setHandle(event.target.value)}
                            placeholder='@username'
                            autoComplete='off'
                            required
                            className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-300'
                        />
                        {error && <p className='text-sm text-red-600'>{error}</p>}
                        <button
                            type='submit'
                            disabled={isSubmitting || handle.trim().length === 0}
                            className='w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
                        >
                            {isSubmitting ? 'Entering...' : 'Enter giveaway'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}

function PlatformButton({
    active,
    onClick,
    label,
}: {
    active: boolean
    onClick: () => void
    label: string
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={
                active
                    ? 'cursor-pointer rounded-full bg-pink-500 px-3 py-2 text-sm font-medium text-white'
                    : 'cursor-pointer rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
            }
        >
            {label}
        </button>
    )
}
