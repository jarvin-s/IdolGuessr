'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import {
    guessShareLines,
    idolPortrait,
    type ClassicAnswer,
    type ClassicFeedback,
    type ClassicMode,
} from '@/lib/classic'

export default function ClassicWinModal({
    open,
    mode,
    answer,
    guesses,
    dailyId,
    onClose,
    onNext,
}: {
    open: boolean
    mode: ClassicMode
    answer: ClassicAnswer | null
    guesses: ClassicFeedback[]
    dailyId: number | null
    onClose: () => void
    onNext?: () => void
}) {
    const [copied, setCopied] = useState(false)
    const portrait = answer ? idolPortrait(answer) : ''
    const gaveUp = guesses.every((guess) => guess.id !== answer?.id)

    useEffect(() => {
        if (!copied) return
        const id = window.setTimeout(() => setCopied(false), 1500)
        return () => window.clearTimeout(id)
    }, [copied])

    if (!open || !answer) return null

    const share = async () => {
        const heading =
            mode === 'daily' ? `Classic #${dailyId ?? ''}` : 'Classic'
        const text = [
            heading.trim(),
            guessShareLines(guesses),
            gaveUp
                ? 'Revealed'
                : `${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}`,
            mode === 'daily'
                ? 'https://idolguessr.fun/classic'
                : 'https://idolguessr.fun/classic/infinite',
        ]
            .filter(Boolean)
            .join('\n')
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
        } catch {
            setCopied(false)
        }
    }

    return (
        <div className='fixed inset-0 z-500 flex items-center justify-center bg-black/40 px-4'>
            <div
                className='w-full max-w-sm rounded-md border border-pink-600 bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                role='dialog'
                aria-modal='true'
                aria-labelledby='classic-result-title'
            >
                {portrait ? (
                    <Image
                        src={portrait}
                        alt=''
                        width={160}
                        height={160}
                        className='mx-auto h-60 w-60 object-cover'
                        unoptimized
                    />
                ) : null}
                <h2
                    id='classic-result-title'
                    className='mt-3 text-2xl font-bold'
                >
                    {answer.name}
                </h2>
                <p className='text-gray-500 dark:text-zinc-400'>
                    {answer.group_name}
                </p>
                <p className='mt-1 text-sm text-gray-500 dark:text-zinc-400'>
                    {gaveUp
                        ? 'Answer revealed'
                        : `Solved in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}`}
                </p>
                {mode === 'daily' ? (
                    <>
                        <button
                            type='button'
                            onClick={() => void share()}
                            className='mx-auto mt-4 block w-50 cursor-pointer rounded-full border border-pink-600 bg-gray-100 px-4 py-1.5 font-bold text-pink-600 transition-colors hover:bg-gray-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-white'
                        >
                            {copied ? 'Copied' : 'Share'}
                        </button>
                        <button
                            type='button'
                            onClick={onClose}
                            className='mx-auto mt-3 block w-50 cursor-pointer rounded-full bg-pink-600 px-4 py-1.5 font-bold text-white transition-colors hover:bg-pink-700'
                        >
                            Close
                        </button>
                    </>
                ) : (
                    <button
                        type='button'
                        onClick={onNext}
                        className='mx-auto mt-3 block w-50 cursor-pointer rounded-full bg-pink-600 px-4 py-1.5 font-bold text-white transition-colors hover:bg-pink-700'
                    >
                        Next idol
                    </button>
                )}
            </div>
        </div>
    )
}
