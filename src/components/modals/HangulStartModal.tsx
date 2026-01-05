import { useState } from 'react'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'

interface HangulStartModalProps {
    isOpen: boolean
    onStart: (filter: GroupFilter) => void
}

export default function HangulStartModal({
    isOpen,
    onStart,
}: HangulStartModalProps) {
    const [selectedFilter, setSelectedFilter] = useState<GroupFilter>('both')
    if (!isOpen) return null

    const handleStart = () => {
        onStart(selectedFilter)
    }

    return (
        <div className='fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative w-full max-w-sm rounded-md bg-white p-10'>
                <div className='mb-4'>
                    <h2 className='text-center text-xl font-bold uppercase md:text-2xl'>
                        Hangul Mode
                    </h2>
                </div>

                <div className='mb-6 rounded-lg bg-purple-50 p-4 text-sm text-gray-700'>
                    <p className='mb-2'>
                        <strong>How to play:</strong>
                    </p>
                    <ul className='list-inside list-disc space-y-1'>
                        <li>Read the idol&apos;s name in Korean (Hangul)</li>
                        <li>Type their English name to guess</li>
                        <li>Use the hint to reveal their group</li>
                    </ul>
                </div>

                <div className='mb-4'>
                    <h2 className='text-center text-xl font-bold uppercase md:text-2xl'>
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
                        onClick={handleStart}
                        className='w-[200px] cursor-pointer rounded-full bg-[#6521c7] px-4 py-1.5 text-white transition-all hover:bg-[#6521c7]/80'
                    >
                        Start
                    </button>
                </div>
            </div>
        </div>
    )
}
