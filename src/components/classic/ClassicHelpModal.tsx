import localFont from 'next/font/local'
import ColorLegend from '@/components/classic/ColorLegend'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

export default function ClassicHelpModal({
    isOpen,
    onClose,
    onBack,
}: {
    isOpen: boolean
    onClose: () => void
    onBack?: () => void
}) {
    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-[650] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-zinc-900'>
                <div className='mb-4 flex items-center justify-between'>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className='flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-100 px-3 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                            aria-label='Go back'
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
                                    d='M10 19l-7-7m0 0l7-7m-7 7h18'
                                />
                            </svg>
                            <span className='text-sm text-gray-600 dark:text-zinc-400'>
                                Go back
                            </span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className='ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        aria-label='Close Help'
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
                </div>

                <h1 className={`${proximaNovaBold.className} text-3xl uppercase`}>
                    How to play
                </h1>
                <p className='text-xl'>Guess the idol from their attributes!</p>

                <ul className='mt-4 space-y-2'>
                    <li className='flex items-start gap-2 text-[16px]'>
                        <span>•</span>
                        <span>Search for an idol and submit a guess</span>
                    </li>
                    <li className='flex items-start gap-2 text-[16px]'>
                        <span>•</span>
                        <span>
                            Each guess shows group, gender, generation, agency,
                            nationality, positions, birth year, and height
                        </span>
                    </li>
                    <li className='flex items-start gap-2 text-[16px]'>
                        <span>•</span>
                        <span>
                            An arrow means the answer is higher or lower for
                            generation, birth year, or height
                        </span>
                    </li>
                    <li className='flex items-start gap-2 text-[16px]'>
                        <span>•</span>
                        <span>Give up appears after 3 guesses in the daily</span>
                    </li>
                </ul>

                <ColorLegend />

                <p className='mt-6 text-lg'>Every day a new idol appears!</p>
            </div>
        </div>
    )
}
