'use client'

import type { UnshuffledMode } from '@/lib/unshuffled'

interface UnshuffledModeModalProps {
    open: boolean
    active?: UnshuffledMode
    onClose: () => void
    onDaily: () => void
    onUnlimited: () => void
}

export default function UnshuffledModeModal({
    open,
    active,
    onClose,
    onDaily,
    onUnlimited,
}: UnshuffledModeModalProps) {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-[600] flex items-center justify-center bg-black/40 px-4'>
            <div
                className='modal-fade-in relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                role='dialog'
                aria-modal='true'
                aria-labelledby='unshuffled-mode-title'
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
                <h2 id='unshuffled-mode-title' className='text-2xl font-bold'>
                    Unshuffled
                </h2>
                <p className='mt-2 text-sm text-gray-500 dark:text-zinc-400'>
                    Put a scrambled song back together.
                </p>
                <div className='mt-6 flex flex-col gap-3'>
                    <button
                        type='button'
                        onClick={onDaily}
                        aria-current={active === 'daily' ? 'page' : undefined}
                        className={`w-full cursor-pointer rounded-full py-3 font-semibold ${
                            active === 'daily'
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-100 text-black dark:bg-zinc-800 dark:text-white'
                        }`}
                    >
                        Daily
                        <span
                            className={`mt-0.5 block text-xs font-normal ${
                                active === 'daily'
                                    ? 'text-white/80'
                                    : 'opacity-70'
                            }`}
                        >
                            One song for everyone, once a day
                        </span>
                    </button>
                    <button
                        type='button'
                        onClick={onUnlimited}
                        aria-current={
                            active === 'infinite' ? 'page' : undefined
                        }
                        className={`w-full cursor-pointer rounded-full py-3 font-semibold ${
                            active === 'infinite'
                                ? 'bg-pink-500 text-white'
                                : 'bg-gray-100 text-black dark:bg-zinc-800 dark:text-white'
                        }`}
                    >
                        Unlimited
                        <span
                            className={`mt-0.5 block text-xs font-normal ${
                                active === 'infinite'
                                    ? 'text-white/80'
                                    : 'text-gray-500 dark:text-zinc-400'
                            }`}
                        >
                            Keep playing, and filter by group
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}
