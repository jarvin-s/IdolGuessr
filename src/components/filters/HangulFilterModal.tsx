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
            <div className='modal-fade-in relative w-full max-w-sm rounded-md bg-white p-10'>
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
                                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Boy groups
                    </button>

                    <button
                        onClick={() => setSelectedFilter('girl-group')}
                        className={`w-full cursor-pointer border-2 px-3 py-2 text-left font-medium transition-all ${
                            selectedFilter === 'girl-group'
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Girl groups
                    </button>

                    <button
                        onClick={() => setSelectedFilter('both')}
                        className={`w-full cursor-pointer border-2 px-3 py-2 text-left font-medium transition-all ${
                            selectedFilter === 'both'
                                ? 'border-black bg-black text-white'
                                : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        Both
                    </button>
                </div>

                <div className='mt-4 flex justify-center'>
                    <button
                        onClick={handleConfirm}
                        className='w-full cursor-pointer rounded-full bg-[#6521c7] px-4 py-1.5 text-white transition-all hover:bg-[#6521c7]/80 md:w-[150px]'
                    >
                        Start
                    </button>
                </div>
            </div>
        </div>
    )
}
