'use client'

export default function RouteError({
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    return (
        <div className='flex min-h-screen items-center justify-center bg-white px-6 text-black dark:bg-zinc-950 dark:text-zinc-100'>
            <div className='max-w-md text-center'>
                <h1 className='text-2xl font-bold'>Something went wrong</h1>
                <p className='mt-2 text-zinc-600 dark:text-zinc-400'>
                    This page crashed while loading. A reload usually brings it
                    back.
                </p>
                <button
                    type='button'
                    onClick={() => {
                        reset()
                        window.location.reload()
                    }}
                    className='mt-6 cursor-pointer rounded-full bg-pink-600 px-5 py-2.5 font-bold text-white'
                >
                    Reload
                </button>
            </div>
        </div>
    )
}
