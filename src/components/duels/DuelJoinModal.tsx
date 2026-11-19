'use client'

import { useState } from 'react'

export default function DuelJoinModal({
    open,
    onClose,
    onJoin,
    error = '',
}: {
    open: boolean
    onClose: () => void
    onJoin: (code: string) => void
    error?: string
}) {
    const [code, setCode] = useState('')
    const [localError, setLocalError] = useState('')

    if (!open) return null

    const join = () => {
        const next = code.trim().toUpperCase()
        if (next.length !== 6) {
            setLocalError('Enter the 6 character lobby code.')
            return
        }
        setLocalError('')
        onJoin(next)
    }

    return (
        <div className='fixed inset-0 z-600 flex items-center justify-center bg-black/40 px-4'>
            <div
                className='modal-fade-in relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                role='dialog'
                aria-modal='true'
                aria-labelledby='duel-join-title'
            >
                <button
                    type='button'
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                    aria-label='Back'
                >
                    <CloseIcon />
                </button>
                <h2 id='duel-join-title' className='text-2xl font-bold'>
                    Join lobby
                </h2>
                <p className='mt-2 text-base text-gray-500 dark:text-zinc-400'>
                    Enter the 6 character code from your friend
                </p>
                <input
                    value={code}
                    maxLength={6}
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') join()
                    }}
                    className='mt-6 w-full border-2 border-gray-200 bg-white px-3 py-2 text-center tracking-[0.3em] uppercase dark:border-zinc-700 dark:bg-zinc-950'
                    placeholder='ABCDEF'
                    autoFocus
                />
                <button
                    type='button'
                    onClick={join}
                    className='mt-4 flex w-full cursor-pointer items-center justify-center rounded-full bg-pink-600 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-pink-700'
                >
                    Join lobby
                </button>
                {error || localError ? (
                    <p className='mt-3 text-sm text-red-600'>{error || localError}</p>
                ) : null}
            </div>
        </div>
    )
}

function CloseIcon() {
    return (
        <svg className='h-4 w-4 text-gray-600 dark:text-zinc-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
        </svg>
    )
}
