import { useState, useEffect } from 'react'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'

interface HangulFilterModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (filter: GroupFilter) => void
}

export default function HangulFilterModal({
    isOpen,
    onClose,
    onConfirm,
}: HangulFilterModalProps) {
    const [selectedFilter, setSelectedFilter] = useState<GroupFilter>('both')

    useEffect(() => {
        if (isOpen) {
            try {
                const savedFilter = localStorage.getItem(
                    'idol-guessr-hangul-group-filter'
                )
                if (
                    savedFilter === 'boy-group' ||
                    savedFilter === 'girl-group' ||
                    savedFilter === 'both'
                ) {
                    setSelectedFilter(savedFilter as GroupFilter)
                } else {
                    setSelectedFilter('both')
                }
            } catch {
                setSelectedFilter('both')
            }
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleConfirm = () => {
        try {
            localStorage.setItem('idol-guessr-hangul-group-filter', selectedFilter)
        } catch {}
        onConfirm(selectedFilter)
    }

    return (
        <div className='fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative w-full max-w-sm rounded-md bg-white dark:bg-zinc-900 p-10'>
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 dark:bg-zinc-800 transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700'
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

                <div className='mb-6 flex items-center justify-center'>
                    <h2 className='text-xl font-bold uppercase md:text-2xl'>
                        Choose Group Type
                    </h2>
                </div>

                <div className='space-y-4'>
                    <button
                        onClick={() => setSelectedFilter('boy-group')}
                        className={`w-full cursor-pointer border-2 px-3 py-2 text-left font-medium transition-all ${
                            selectedFilter === 'boy-group'
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                    >
                        Boy groups
                    </button>

                    <button
                        onClick={() => setSelectedFilter('girl-group')}
                        className={`w-full cursor-pointer border-2 px-3 py-2 text-left font-medium transition-all ${
                            selectedFilter === 'girl-group'
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                    >
                        Girl groups
                    </button>

                    <button
                        onClick={() => setSelectedFilter('both')}
                        className={`w-full cursor-pointer border-2 px-3 py-2 text-left font-medium transition-all ${
                            selectedFilter === 'both'
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-500 hover:bg-gray-50 dark:hover:bg-zinc-800'
                        }`}
                    >
                        Both
                    </button>
                </div>

                <div className='mt-4 flex justify-center'>
                    <button
                        onClick={handleConfirm}
                        className='w-full cursor-pointer rounded-full bg-pink-600 px-4 py-1.5 text-white transition-all hover:bg-pink-700 md:w-[150px]'
                    >
                        Start
                    </button>
                </div>
            </div>
        </div>
    )
}
