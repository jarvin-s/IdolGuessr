'use client'

interface UnshuffledPauseModalProps {
    open: boolean
    onResume: () => void
}

export default function UnshuffledPauseModal({
    open,
    onResume,
}: UnshuffledPauseModalProps) {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-[500] flex items-center justify-center bg-black/40 px-4'>
            <div
                className='w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                role='dialog'
                aria-modal='true'
                aria-labelledby='unshuffled-pause-title'
            >
                <h2 id='unshuffled-pause-title' className='text-2xl font-bold'>
                    GAME PAUSE
                </h2>
                <p className='mt-2 text-gray-500 dark:text-zinc-400'>
                    Pick up where you left off.
                </p>
                <button
                    type='button'
                    onClick={onResume}
                    autoFocus
                    className='mx-auto mt-6 block w-fit cursor-pointer rounded-full bg-black px-8 py-3 font-semibold text-white dark:bg-white dark:text-black'
                >
                    RESUME
                </button>
            </div>
        </div>
    )
}
