import { useState, useEffect, useRef } from 'react'

interface FilterModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (
        groupFilter: 'boy-group' | 'girl-group' | 'both',
        genFilter: number[]
    ) => void
    onPlayAgain?: (
        groupFilter: 'boy-group' | 'girl-group' | 'both',
        genFilter: number[]
    ) => void
}

const GROUP_OPTIONS: {
    value: 'boy-group' | 'girl-group' | 'both'
    label: string
}[] = [
    { value: 'both', label: 'Both' },
    { value: 'boy-group', label: 'Boy Groups' },
    { value: 'girl-group', label: 'Girl Groups' },
]

const GEN_OPTIONS: { value: number; label: string }[] = [
    { value: 3, label: 'Gen 3' },
    { value: 4, label: 'Gen 4' },
    { value: 5, label: 'Gen 5' },
]

export default function FilterModal({
    isOpen,
    onClose,
    onConfirm,
    onPlayAgain,
}: FilterModalProps) {
    const [selectedGroupFilter, setSelectedGroupFilter] = useState<
        'boy-group' | 'girl-group' | 'both'
    >('both')
    const [selectedGens, setSelectedGens] = useState<number[]>([3, 4, 5])
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
    const [genDropdownOpen, setGenDropdownOpen] = useState(false)

    const groupDropdownRef = useRef<HTMLDivElement>(null)
    const genDropdownRef = useRef<HTMLDivElement>(null)

    // Load saved filters when modal opens
    useEffect(() => {
        if (isOpen) {
            try {
                // Load group filter
                const savedGroupFilter = localStorage.getItem(
                    'idol-guessr-group-filter'
                )
                if (
                    savedGroupFilter === 'boy-group' ||
                    savedGroupFilter === 'girl-group' ||
                    savedGroupFilter === 'both'
                ) {
                    setSelectedGroupFilter(savedGroupFilter)
                } else {
                    setSelectedGroupFilter('both')
                }

                // Load gen filter
                const savedGenFilter = localStorage.getItem(
                    'idol-guessr-gen-filter'
                )
                if (savedGenFilter) {
                    const parsed = JSON.parse(savedGenFilter)
                    if (
                        Array.isArray(parsed) &&
                        parsed.length > 0 &&
                        parsed.every(
                            (g: unknown) =>
                                typeof g === 'number' && [3, 4, 5].includes(g)
                        )
                    ) {
                        setSelectedGens(parsed)
                    } else {
                        setSelectedGens([3, 4, 5])
                    }
                } else {
                    setSelectedGens([3, 4, 5])
                }
            } catch {
                setSelectedGroupFilter('both')
                setSelectedGens([3, 4, 5])
            }

            // Reset dropdown states
            setGroupDropdownOpen(false)
            setGenDropdownOpen(false)
        }
    }, [isOpen])

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

    const handleConfirm = () => {
        if (selectedGens.length === 0) return // Require at least one gen

        try {
            localStorage.setItem('idol-guessr-group-filter', selectedGroupFilter)
            localStorage.setItem(
                'idol-guessr-gen-filter',
                JSON.stringify(selectedGens)
            )
        } catch {
            // Ignore localStorage errors
        }

        onConfirm(selectedGroupFilter, selectedGens)
        if (onPlayAgain) {
            onPlayAgain(selectedGroupFilter, selectedGens)
        }
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
                {/* Close button in top right of modal */}
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                    aria-label='Close Change Group Type'
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
                        onClick={handleConfirm}
                        disabled={selectedGens.length === 0}
                        className='w-full cursor-pointer rounded-full bg-pink-500 px-4 py-1.5 text-white transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50 md:w-[150px]'
                    >
                        Start
                    </button>
                </div>
            </div>
        </div>
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
