'use client'

interface ZoomedModeModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ZoomedModeModal({
    isOpen,
    onClose,
}: ZoomedModeModalProps) {
    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-[700] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative w-full max-w-md rounded-lg bg-white p-6 dark:bg-zinc-900'>
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

                <h2 className='pr-10 text-2xl font-bold'>Zoomed mode</h2>
                <p className='mt-4 text-lg leading-relaxed'>
                    This mode is still in development and can be buggy. The zoom can land on parts of the
                    photo that are hard to recognise, and images can look blurry
                    or low quality.
                </p>
                <p className='mt-4 text-lg leading-relaxed'>
                    Please be sure to send us feedback if you encounter any issues.
                </p>
                <button
                    type='button'
                    onClick={onClose}
                    className='mt-6 w-full cursor-pointer rounded-full bg-pink-500 px-4 py-3 font-medium text-white transition-colors hover:bg-pink-600'
                >
                    Got it
                </button>
            </div>
        </div>
    )
}
