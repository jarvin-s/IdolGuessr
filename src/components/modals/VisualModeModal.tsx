'use client'

interface VisualModeModalProps {
    open: boolean
    onClose: () => void
    onDaily: () => void
    onInfinite: () => void
    onChallenge: () => void
}

export default function VisualModeModal({
    open,
    onClose,
    onDaily,
    onInfinite,
    onChallenge,
}: VisualModeModalProps) {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-[600] flex items-center justify-center bg-black/40 px-4'>
            <div
                className='modal-fade-in relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                role='dialog'
                aria-modal='true'
                aria-labelledby='visual-mode-title'
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
                <h2 id='visual-mode-title' className='text-2xl font-bold'>
                    Visual
                </h2>
                <p className='mt-2 text-base text-gray-500 dark:text-zinc-400'>
                    Guess the idol based on pixelated or zoomed images
                </p>
                <div className='mt-6 flex flex-col items-center gap-3'>
                    <button
                        type='button'
                        onClick={onDaily}
                        className='flex w-[200px] cursor-pointer items-center justify-center gap-2 rounded-full bg-pink-600 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-pink-700'
                    >
                        <DailyIcon />
                        Daily
                    </button>
                    <button
                        type='button'
                        onClick={onInfinite}
                        className='flex w-[200px] cursor-pointer items-center justify-center gap-2 rounded-full bg-pink-600 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-pink-700'
                    >
                        <InfiniteIcon />
                        Infinite
                    </button>
                    <button
                        type='button'
                        onClick={onChallenge}
                        className='flex w-[200px] cursor-pointer items-center justify-center gap-2 rounded-full bg-pink-600 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-pink-700'
                    >
                        <ChallengeIcon />
                        Challenge
                    </button>
                </div>
            </div>
        </div>
    )
}

function DailyIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
        >
            <path
                fill='currentColor'
                d='M7.195 2.845a.75.75 0 0 0-1.467 0c-.232 1.096-.55 1.835-.99 2.361c-.429.516-1.029.893-1.95 1.166a.75.75 0 0 0 0 1.438c.885.262 1.48.617 1.916 1.125c.444.516.782 1.26 1.024 2.402a.75.75 0 0 0 1.467 0c.242-1.143.58-1.886 1.024-2.402c.436-.508 1.03-.863 1.917-1.125a.75.75 0 0 0 0-1.438c-.886-.262-1.481-.617-1.917-1.125c-.444-.516-.782-1.26-1.024-2.402m8.303 3.251a.75.75 0 0 0-1.458 0c-.554 2.292-1.141 3.674-1.972 4.638c-.82.952-1.947 1.576-3.77 2.192a.75.75 0 0 0 0 1.421c1.904.643 3.046 1.322 3.852 2.292c.819.986 1.362 2.355 1.89 4.537a.75.75 0 0 0 1.458 0c.554-2.291 1.142-3.673 1.972-4.637c.82-.952 1.947-1.576 3.77-2.192a.75.75 0 0 0 0-1.421c-1.907-.644-3.047-1.32-3.852-2.29c-.818-.984-1.36-2.352-1.89-4.54'
            />
        </svg>
    )
}

function ChallengeIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6' />
            <path d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18' />
            <path d='M4 22h16' />
            <path d='M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' />
            <path d='M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' />
            <path d='M18 2H6v7a6 6 0 0 0 12 0V2Z' />
        </svg>
    )
}

function InfiniteIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 512 512'
        >
            <path
                fill='currentColor'
                d='M382 136c-40.87 0-73.46 20.53-93.6 37.76l-.71.61l-11.47 12.47l25.32 41.61l18.74-18.79C339.89 193.1 361.78 184 382 184c40.8 0 74 32.3 74 72s-33.2 72-74 72c-62 0-104.14-81.95-104.56-82.78C275 240.29 221.56 136 130 136C62.73 136 8 189.83 8 256s54.73 120 122 120c32.95 0 65.38-13.11 93.79-37.92l.61-.54l11.38-12.38l-25.33-41.61l-18.83 18.88C172 319.4 151.26 328 130 328c-40.8 0-74-32.3-74-72s33.2-72 74-72c62 0 104.14 81.95 104.56 82.78C237 271.71 290.44 376 382 376c67.27 0 122-53.83 122-120s-54.73-120-122-120'
            />
        </svg>
    )
}
