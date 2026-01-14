'use client'

import { useState } from 'react'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'
type IdolCount = 5 | 10 | 15 | 20

interface ChallengeCreateModalProps {
    isOpen: boolean
    isCreating: boolean
    onClose: () => void
    onCreate: (idolCount: IdolCount, groupFilter: GroupFilter) => void
}

export default function ChallengeCreateModal({
    isOpen,
    isCreating,
    onClose,
    onCreate,
}: ChallengeCreateModalProps) {
    const [selectedCount, setSelectedCount] = useState<IdolCount>(10)
    const [selectedFilter, setSelectedFilter] = useState<GroupFilter>('both')

    if (!isOpen) return null

    const handleCreate = () => {
        if (!isCreating) {
            onCreate(selectedCount, selectedFilter)
        }
    }

    const idolCounts: IdolCount[] = [5, 10, 15, 20]

    return (
        <div className='fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative w-full max-w-sm rounded-md bg-white p-8'>
                {/* Close button */}
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                    aria-label='Close'
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

                <div className='mb-4 flex items-center justify-center gap-2'>
                    <ChallengeIcon />
                    <h2 className='text-xl font-bold uppercase md:text-2xl'>
                        Challenge Mode
                    </h2>
                </div>

                <div className='mb-6 bg-pink-100 p-3 text-sm'>
                    <p className='mb-2 text-lg'>
                        <strong>How it works:</strong>
                    </p>
                    <ul className='space-y-1 text-sm'>
                        <li className='flex items-start gap-2'>
                            <span>•</span>
                            <span>Choose how many idols to guess</span>
                        </li>
                        <li className='flex items-start gap-2'>
                            <span>•</span>
                            <span>Get a shareable link to send to friends</span>
                        </li>
                        <li className='flex items-start gap-2'>
                            <span>•</span>
                            <span>Everyone gets the same idols</span>
                        </li>
                        <li className='flex items-start gap-2'>
                            <span>•</span>
                            <span>Compare results and see who wins!</span>
                        </li>
                    </ul>
                </div>

                {/* Idol count selection */}
                <div className='mb-4'>
                    <h3 className='mb-2 text-center text-lg font-bold uppercase'>
                        Number of Idols
                    </h3>
                    <div className='grid grid-cols-4 gap-2'>
                        {idolCounts.map((count) => (
                            <button
                                key={count}
                                onClick={() => setSelectedCount(count)}
                                className={`cursor-pointer border-2 px-3 py-2 text-center font-bold transition-all ${
                                    selectedCount === count
                                        ? 'border-pink-500 bg-pink-500 text-white'
                                        : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                {count}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Group filter selection */}
                <div className='mb-6'>
                    <h3 className='mb-2 text-center text-lg font-bold uppercase'>
                        Group Type
                    </h3>
                    <div className='space-y-2'>
                        <button
                            onClick={() => setSelectedFilter('boy-group')}
                            className={`w-full cursor-pointer border-2 px-3 py-2 text-left font-medium transition-all ${
                                selectedFilter === 'boy-group'
                                    ? 'border-pink-500 bg-pink-500 text-white'
                                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            Boy groups
                        </button>

                        <button
                            onClick={() => setSelectedFilter('girl-group')}
                            className={`w-full cursor-pointer border-2 px-3 py-2 text-left font-medium transition-all ${
                                selectedFilter === 'girl-group'
                                    ? 'border-pink-500 bg-pink-500 text-white'
                                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            Girl groups
                        </button>

                        <button
                            onClick={() => setSelectedFilter('both')}
                            className={`w-full cursor-pointer border-2 px-3 py-2 text-left font-medium transition-all ${
                                selectedFilter === 'both'
                                    ? 'border-pink-500 bg-pink-500 text-white'
                                    : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                            Both
                        </button>
                    </div>
                </div>

                <div className='flex justify-center'>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className='w-[200px] cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-bold text-white transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {isCreating ? 'Creating...' : 'Create challenge'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function ChallengeIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='32'
            height='32'
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
