'use client'

export default function DuelChoiceModal({
    open,
    onClose,
    onCreate,
    onJoin,
    onQuickMatch,
}: {
    open: boolean
    onClose: () => void
    onCreate: () => void
    onJoin: () => void
    onQuickMatch: () => void
}) {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-600 flex items-center justify-center bg-black/40 px-4'>
            <div
                className='modal-fade-in relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                role='dialog'
                aria-modal='true'
                aria-labelledby='duel-choice-title'
            >
                <button
                    type='button'
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                    aria-label='Close'
                >
                    <CloseIcon />
                </button>
                <h2 id='duel-choice-title' className='text-2xl font-bold'>
                    Duels
                </h2>
                <p className='mt-2 text-base text-gray-500 dark:text-zinc-400'>
                    Challenge friends or jump into a match
                </p>
                <div className='mt-6 flex flex-col items-center gap-3'>
                    <button
                        type='button'
                        onClick={onCreate}
                        className='flex w-50 cursor-pointer items-center justify-center gap-2 rounded-full bg-pink-600 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-pink-700'
                    >
                        <CreateIcon />
                        Create lobby
                    </button>
                    <button
                        type='button'
                        onClick={onJoin}
                        className='flex w-50 cursor-pointer items-center justify-center gap-2 rounded-full bg-pink-600 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-pink-700'
                    >
                        <JoinIcon />
                        Join lobby
                    </button>
                    <button
                        type='button'
                        onClick={onQuickMatch}
                        className='cursor-pointer text-sm text-gray-500 underline dark:text-zinc-400'
                    >
                        Quick match
                    </button>
                </div>
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

function CreateIcon() {
    return (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
            <path d='M12 5v14' />
            <path d='M5 12h14' />
        </svg>
    )
}

function JoinIcon() {
    return (
        <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4' />
            <path d='M10 17l5-5-5-5' />
            <path d='M15 12H3' />
        </svg>
    )
}
