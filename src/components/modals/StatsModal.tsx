import { useEffect, useState } from 'react'
import UserStats, { loadUnlimitedStats } from '../stats/UserStats'
import {
    DIFFICULTIES,
    DIFFICULTY_LABELS,
    type InfiniteDifficulty,
} from '@/utils/difficulty'

interface StatsModalProps {
    isOpen: boolean
    onClose: () => void
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stats: any
    statsLoaded: boolean
    gameMode?: 'daily' | 'unlimited' | 'hangul'
    difficulty?: InfiniteDifficulty
}

export default function StatsModal({
    isOpen,
    onClose,
    stats,
    statsLoaded,
    gameMode = 'daily',
    difficulty = 'normal',
}: StatsModalProps) {
    const [selectedDifficulty, setSelectedDifficulty] =
        useState<InfiniteDifficulty>(difficulty)

    useEffect(() => {
        if (isOpen) setSelectedDifficulty(difficulty)
    }, [isOpen, difficulty])

    if (!isOpen) return null

    const isUnlimited = gameMode === 'unlimited'
    const shownStats =
        isUnlimited && selectedDifficulty !== difficulty
            ? loadUnlimitedStats(selectedDifficulty)
            : stats

    const difficultyTabs = isUnlimited ? (
        <div className='mb-6 flex rounded-full bg-gray-100 p-1'>
            {DIFFICULTIES.map((option) => (
                <button
                    key={option}
                    type='button'
                    onClick={() => setSelectedDifficulty(option)}
                    className={`flex-1 cursor-pointer rounded-full px-2 py-1.5 text-xs transition-colors sm:text-sm ${
                        selectedDifficulty === option
                            ? 'bg-white font-medium text-black shadow-sm'
                            : 'text-gray-600 hover:text-black'
                    }`}
                >
                    {DIFFICULTY_LABELS[option]}
                </button>
            ))}
        </div>
    ) : null

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
                    stats={shownStats}
                    isLoaded={statsLoaded}
                    className='border-0 shadow-none'
                    gameMode={gameMode}
                    subHeader={difficultyTabs}
                />
            </div>
        </div>
    )
}
