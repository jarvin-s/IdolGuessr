'use client'

interface ChallengeIntroModalProps {
    isOpen: boolean
    idolCount: number
    groupFilter: string
    onStart: () => void
}

export default function ChallengeIntroModal({
    isOpen,
    idolCount,
    groupFilter,
    onStart,
}: ChallengeIntroModalProps) {
    if (!isOpen) return null

    const getGroupFilterText = () => {
        if (groupFilter === 'both') return 'All groups'
        if (groupFilter === 'boy-group') return 'Boy groups'
        if (groupFilter === 'girl-group') return 'Girl groups'
        return 'All groups'
    }

    return (
        <div className='fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4'>
            <div className='modal-fade-in relative w-full max-w-lg bg-white dark:bg-zinc-900 px-8 py-6'>
                <div className='mb-6 text-center'>
                    <h2 className='mb-4 text-3xl font-bold uppercase'>
                        Challenge ready!
                    </h2>
                    <p className='mb-6 text-black dark:text-zinc-100'>
                        You will be shown {idolCount} idol
                        {idolCount !== 1 ? 's' : ''}, can you guess them all?
                    </p>
                </div>

                <button
                    onClick={onStart}
                    className='w-full cursor-pointer rounded-full bg-pink-600 py-3 font-bold text-white uppercase transition-colors hover:bg-pink-700'
                >
                    Start challenge!
                </button>

                <div className='my-6 flex bg-gradient-to-r from-pink-100 dark:from-pink-950 to-pink-50 dark:to-zinc-900 p-6'>
                    <div className='space-y-3'>
                        <div className='flex items-center gap-1'>
                            Idols:
                            <span className='font-bold text-black dark:text-zinc-100'>
                                {idolCount}
                            </span>
                        </div>
                        <div className='flex items-center gap-1'>
                            Group type:
                            <span className='font-bold text-black dark:text-zinc-100'>
                                {getGroupFilterText()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
