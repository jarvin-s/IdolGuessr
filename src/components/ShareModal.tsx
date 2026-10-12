'use client'

import { useEffect } from 'react'
import ShareOptionButton from './ShareOptionButton'

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    onCopyPNG: () => void
    onCopyText: () => void
    isGenerating: boolean
    copyStatus: 'idle' | 'copied-png' | 'copied-text'
}

export default function ShareModal({
    isOpen,
    onClose,
    onCopyPNG,
    onCopyText,
    isGenerating,
    copyStatus,
}: ShareModalProps) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }

        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4'>
            <div className='relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 p-8 shadow-xl'>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700'
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

                {/* Modal Content */}
                <h2 className='mb-2 text-2xl font-bold text-black dark:text-zinc-100'>
                    Share your result
                </h2>
                <p className='mb-6 text-gray-600 dark:text-zinc-400'>
                    Choose how you&apos;d like to share your daily result
                </p>

                {/* Share Options */}
                <div className='space-y-3'>
                    {/* Copy PNG Button */}
                    <ShareOptionButton
                        onClick={onCopyPNG}
                        disabled={isGenerating}
                        variant='primary'
                        isLoading={isGenerating}
                        isCopied={copyStatus === 'copied-png'}
                        icon={
                            <svg
                                className='h-5 w-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                                />
                            </svg>
                        }
                        label='Copy image (PNG)'
                    />

                    {/* Copy Text Button */}
                    <ShareOptionButton
                        onClick={onCopyText}
                        disabled={isGenerating}
                        variant='secondary'
                        isCopied={copyStatus === 'copied-text'}
                        icon={
                            <svg
                                className='h-5 w-5'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                                />
                            </svg>
                        }
                        label='Copy text result'
                    />
                </div>
            </div>
        </div>
    )
}

