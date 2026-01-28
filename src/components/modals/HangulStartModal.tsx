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
                <div className='mb-4 flex items-center justify-center'>
                    <HangulIcon />
                    <h2 className='text-center text-xl font-bold uppercase md:text-2xl'>
                        Hangul Mode
                    </h2>
                </div>

                <div className='mb-6 bg-purple-100 p-3 text-sm'>
                    <p className='mb-2'>
                        <strong>How to play:</strong>
                    </p>
                    <ul className='list-inside list-disc space-y-1'>
                        <li>Read the idol&apos;s name in Korean (Hangul).</li>
                        <li>Type their English name to guess.</li>
                        <li>Use the hint to reveal their group.</li>
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

                <div className='mt-4 flex justify-center'>
                    <button
                        onClick={handleStart}
                        className='w-[200px] cursor-pointer rounded-full bg-pink-500 px-4 py-1.5 text-white transition-all hover:bg-pink-600'
                    >
                        Start
                    </button>
                </div>
            </div>
        </div>
    )
}

function HangulIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='36'
            height='36'
            viewBox='0 0 24 24'
        >
            <path
                fill='currentColor'
                d='M8 4v2H4v2h2.39C5.55 8.74 5 9.8 5 11c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.2-.55-2.26-1.39-3H14V6h-4V4m5 0v12h2v-5h3V9h-3V4M9 9c1.12 0 2 .88 2 2s-.88 2-2 2s-2-.88-2-2s.88-2 2-2m-2 7v4h10v-2H9v-2Z'
            />
        </svg>
    )
}
