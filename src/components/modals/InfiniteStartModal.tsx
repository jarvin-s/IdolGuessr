import { useState, useRef, useEffect } from 'react'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'

interface InfiniteStartModalProps {
    isOpen: boolean
    onStart: (groupFilter: GroupFilter, genFilter: number[]) => void
}

const GROUP_OPTIONS: { value: GroupFilter; label: string }[] = [
    { value: 'both', label: 'Both' },
    { value: 'boy-group', label: 'Boy groups' },
    { value: 'girl-group', label: 'Girl groups' },
]

const GEN_OPTIONS: { value: number; label: string }[] = [
    { value: 3, label: 'Gen 3' },
    { value: 4, label: 'Gen 4' },
    { value: 5, label: 'Gen 5' },
]

export default function InfiniteStartModal({
    isOpen,
    onStart,
}: InfiniteStartModalProps) {
    const [selectedGroupFilter, setSelectedGroupFilter] =
        useState<GroupFilter>('both')
    const [selectedGens, setSelectedGens] = useState<number[]>([3, 4, 5])
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
    const [genDropdownOpen, setGenDropdownOpen] = useState(false)

    const groupDropdownRef = useRef<HTMLDivElement>(null)
    const genDropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                groupDropdownRef.current &&
                !groupDropdownRef.current.contains(event.target as Node)
            ) {
                setGroupDropdownOpen(false)
            }
            if (
                genDropdownRef.current &&
                !genDropdownRef.current.contains(event.target as Node)
            ) {
                setGenDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!isOpen) return null

    const handleStart = () => {
        if (selectedGens.length === 0) return // Require at least one gen
        onStart(selectedGroupFilter, selectedGens)
    }

    const toggleGen = (gen: number) => {
        setSelectedGens((prev) => {
            if (prev.includes(gen)) {
                // Don't allow deselecting if it's the last one
                if (prev.length === 1) return prev
                return prev.filter((g) => g !== gen)
            }
            return [...prev, gen].sort()
        })
    }

    const getGenDisplayText = () => {
        if (selectedGens.length === 3) return 'All Gens'
        return selectedGens.map((g) => `Gen ${g}`).join(', ')
    }

    const getGroupDisplayText = () => {
        const option = GROUP_OPTIONS.find(
            (opt) => opt.value === selectedGroupFilter
        )
        return option?.label || 'Both'
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
                        Filters
                    </h2>
                </div>

                {/* Group Type Dropdown */}
                <div className='mb-4'>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>
                        Group Type
                    </label>
                    <div ref={groupDropdownRef} className='relative'>
                        <button
                            type='button'
                            onClick={() => {
                                setGroupDropdownOpen(!groupDropdownOpen)
                                setGenDropdownOpen(false)
                            }}
                            className='flex w-full cursor-pointer items-center justify-between border-2 border-gray-200 bg-white px-3 py-2 text-left font-medium transition-all hover:border-gray-300'
                        >
                            <span>{getGroupDisplayText()}</span>
                            <ChevronDownIcon
                                className={`h-5 w-5 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {groupDropdownOpen && (
                            <div className='absolute z-10 mt-1 w-full border-2 border-gray-200 bg-white shadow-lg'>
                                {GROUP_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type='button'
                                        onClick={() => {
                                            setSelectedGroupFilter(option.value)
                                            setGroupDropdownOpen(false)
                                        }}
                                        className={`w-full cursor-pointer px-3 py-2 text-left font-medium transition-all hover:bg-gray-50 ${
                                            selectedGroupFilter === option.value
                                                ? 'bg-gray-100'
                                                : ''
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Gen Multi-Select Dropdown */}
                <div className='mb-6'>
                    <label className='mb-1 block text-sm font-medium text-gray-700'>
                        Generation
                    </label>
                    <div ref={genDropdownRef} className='relative'>
                        <button
                            type='button'
                            onClick={() => {
                                setGenDropdownOpen(!genDropdownOpen)
                                setGroupDropdownOpen(false)
                            }}
                            className='flex w-full cursor-pointer items-center justify-between border-2 border-gray-200 bg-white px-3 py-2 text-left font-medium transition-all hover:border-gray-300'
                        >
                            <span>{getGenDisplayText()}</span>
                            <ChevronDownIcon
                                className={`h-5 w-5 transition-transform ${genDropdownOpen ? 'rotate-180' : ''}`}
                            />
                        </button>
                        {genDropdownOpen && (
                            <div className='absolute z-10 mt-1 w-full border-2 border-gray-200 bg-white shadow-lg'>
                                {GEN_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type='button'
                                        onClick={() => toggleGen(option.value)}
                                        className='flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left font-medium transition-all hover:bg-gray-50'
                                    >
                                        <div
                                            className={`flex h-5 w-5 items-center justify-center border-2 ${
                                                selectedGens.includes(
                                                    option.value
                                                )
                                                    ? 'border-black bg-black'
                                                    : 'border-gray-300 bg-white'
                                            }`}
                                        >
                                            {selectedGens.includes(
                                                option.value
                                            ) && (
                                                <CheckIcon className='h-3 w-3 text-white' />
                                            )}
                                        </div>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className='flex justify-center'>
                    <button
                        onClick={handleStart}
                        disabled={selectedGens.length === 0}
                        className='w-[200px] cursor-pointer rounded-full bg-pink-500 px-4 py-1.5 text-white transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50'
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

function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className={className}
            viewBox='0 0 20 20'
            fill='currentColor'
        >
            <path
                fillRule='evenodd'
                d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'
                clipRule='evenodd'
            />
        </svg>
    )
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className={className}
            viewBox='0 0 20 20'
            fill='currentColor'
        >
            <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
            />
        </svg>
    )
}
