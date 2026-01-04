import UserStats from '../stats/UserStats'

interface StatsModalProps {
    isOpen: boolean
    onClose: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats: any
    statsLoaded: boolean
    gameMode?: 'daily' | 'unlimited' | 'hangul'
}

export default function StatsModal({
    isOpen,
    onClose,
    stats,
    statsLoaded,
    gameMode = 'daily',
}: StatsModalProps) {
    if (!isOpen) return null

    return (
        <div className='bg-opacity-50 fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white'>
                <div className='absolute top-4 right-4 flex gap-2'>
                    <button
                        onClick={onClose}
                        className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                        aria-label='Close Statistics'
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

                <UserStats
                    stats={stats}
                    isLoaded={statsLoaded}
                    className='border-0 shadow-none'
                    gameMode={gameMode}
                />
            </div>
        </div>
    )
}
