import { useState } from 'react'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'

interface InfiniteStartModalProps {
    isOpen: boolean
    onStart: (filter: GroupFilter) => void
}

export default function InfiniteStartModal({
    isOpen,
    onStart,
}: InfiniteStartModalProps) {
    const [selectedFilter, setSelectedFilter] = useState<GroupFilter>('both')
    if (!isOpen) return null

    const handleStart = () => {
        onStart(selectedFilter)
    }

    return (
        <div className='fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative w-full max-w-sm rounded-md bg-white p-10'>
                <div className='mb-4 flex items-center justify-center gap-2'>
                    <InfiniteIcon />
                    <h2 className='text-xl font-bold uppercase md:text-2xl'>
                        Infinite Mode
                    </h2>
                </div>

                <div className='mb-6 bg-purple-100 p-3 text-sm'>
                    <p className='mb-2 text-lg'>
                        <strong>How to play:</strong>
                    </p>
                    <ul className='space-y-1 text-sm'>
                        <li className='flex items-start gap-2'>
                            <span>•</span>
                            <span>
                                Guess the (pixelated) idol&apos;s name in 6
                                tries.
                            </span>
                        </li>
                    </ul>
                    <li className='flex items-start gap-2'>
                        <span>•</span>
                        <span>
                            After guessing correctly, instantly move on to the
                            next idol.
                        </span>
                    </li>
                    <li className='flex items-start gap-2'>
                        <span>•</span>
                        <span>Enjoy the endless idols!</span>
                    </li>
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
                        className='w-[200px] cursor-pointer rounded-full bg-pink-600 px-4 py-1.5 text-white transition-all hover:bg-pink-700'
                    >
                        Start
                    </button>
                </div>
            </div>
        </div>
    )
}

function InfiniteIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='36'
            height='36'
            viewBox='0 0 512 512'
        >
            <path
                fill='currentColor'
                d='M382 136c-40.87 0-73.46 20.53-93.6 37.76l-.71.61l-11.47 12.47l25.32 41.61l18.74-18.79C339.89 193.1 361.78 184 382 184c40.8 0 74 32.3 74 72s-33.2 72-74 72c-62 0-104.14-81.95-104.56-82.78C275 240.29 221.56 136 130 136C62.73 136 8 189.83 8 256s54.73 120 122 120c32.95 0 65.38-13.11 93.79-37.92l.61-.54l11.38-12.38l-25.33-41.61l-18.83 18.88C172 319.4 151.26 328 130 328c-40.8 0-74-32.3-74-72s33.2-72 74-72c62 0 104.14 81.95 104.56 82.78C237 271.71 290.44 376 382 376c67.27 0 122-53.83 122-120s-54.73-120-122-120'
            />
        </svg>
    )
}
