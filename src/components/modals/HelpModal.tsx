import localFont from 'next/font/local'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

interface HelpModalProps {
    isOpen: boolean
    onClose: () => void
    onShowFeedback?: () => void
    onBack?: () => void
}

export default function HelpModal({ isOpen, onClose, onBack }: HelpModalProps) {
    if (!isOpen) return null

    return (
        <div className='bg-opacity-50 fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6'>
                <div className='mb-4 flex items-center justify-between'>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className='flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-100 px-3 transition-colors hover:bg-gray-200'
                            aria-label='Go back'
                        >
                            <svg
                                className='h-4 w-4 text-gray-600'
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
                            <span className='text-sm text-gray-600'>
                                Go back
                            </span>
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className='ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                        aria-label='Close Help'
                    >
                        <svg
                            className='h-4 w-4 text-gray-600'
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

                <h1
                    className={`${proximaNovaBold.className} text-3xl uppercase`}
                >
                    How to play
                </h1>
                <p className='text-xl'>Guess the Idol in 6 tries!</p>

                <ul className='mt-4 space-y-2 font-bold'>
                    <li className='flex items-start gap-2 text-[16px]'>
                        <span>•</span>
                        <span>
                            Each guess must be a valid K-pop idol stage name
                        </span>
                    </li>
                    <li className='flex items-start gap-2 text-[16px]'>
                        <span>•</span>
                        <span>
                            The image will become clearer with each wrong guess
                        </span>
                    </li>
                </ul>

                <div className='mt-6 grid grid-cols-3 gap-2'>
                    <div className='flex flex-col gap-2 select-none'>
                        <div
                            className='aspect-square w-full overflow-hidden rounded bg-gray-100'
                            style={{
                                backgroundImage: `url('/images/how-to-play-1.png')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        <div className='flex h-6 items-center justify-center gap-1 rounded-sm bg-black px-2'>
                            <div className='h-2.5 w-2.5 rounded-full bg-red-400/75' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-2 select-none'>
                        <div
                            className='aspect-square w-full overflow-hidden rounded bg-gray-100'
                            style={{
                                backgroundImage: `url('/images/how-to-play-2.png')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        <div className='flex h-6 items-center justify-center gap-1 rounded-sm bg-black px-2'>
                            <div className='h-2.5 w-2.5 rounded-full bg-red-400/75' />
                            <div className='h-2.5 w-2.5 rounded-full bg-red-400/75' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                        </div>
                    </div>
                    <div className='flex flex-col gap-2 select-none'>
                        <div
                            className='aspect-square w-full overflow-hidden rounded bg-gray-100'
                            style={{
                                backgroundImage: `url('/images/how-to-play-3.png')`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                            }}
                        />
                        <div className='flex h-6 items-center justify-center gap-1 rounded-sm bg-black px-2'>
                            <div className='h-2.5 w-2.5 rounded-full bg-red-400/75' />
                            <div className='h-2.5 w-2.5 rounded-full bg-red-400/75' />
                            <div className='h-2.5 w-2.5 rounded-full bg-green-400' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                            <div className='h-2.5 w-2.5 rounded-full bg-white' />
                        </div>
                    </div>
                </div>

                <p className='mt-6 text-lg'>Every day a new idol appears!</p>
            </div>
        </div>
    )
}
