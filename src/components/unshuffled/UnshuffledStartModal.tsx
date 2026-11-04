'use client'

interface UnshuffledStartModalProps {
    open: boolean
    loading: boolean
    error?: string
    onStart: () => void
}

export default function UnshuffledStartModal({
    open,
    loading,
    error = '',
    onStart,
}: UnshuffledStartModalProps) {
    if (!open) return null

    return (
        <div className='fixed inset-0 z-[500] flex items-center justify-center bg-black/40 px-4'>
            <div className='w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'>
                <h2 className='text-2xl font-bold'>Unshuffled</h2>
                <ul className='mt-4 space-y-2 text-left text-sm text-gray-600 dark:text-zinc-300'>
                    <li>Today&apos;s song has been scrambled.</li>
                    <li>Tap a piece to hear it, then drag it into the puzzle.</li>
                    <li>A green square shows where the piece will land.</li>
                    <li>The two corner pieces are already in place.</li>
                    <li>Check sends wrong pieces back.</li>
                </ul>
                {error && <p className='mt-4 text-sm text-red-600'>{error}</p>}
                <button
                    type='button'
                    onClick={onStart}
                    disabled={loading || Boolean(error)}
                    className='mt-6 w-full cursor-pointer rounded-full bg-black py-3 font-semibold text-white transition-opacity disabled:cursor-default disabled:opacity-50 dark:bg-white dark:text-black'
                >
                    {loading ? 'Loading…' : 'START'}
                </button>
            </div>
        </div>
    )
}
