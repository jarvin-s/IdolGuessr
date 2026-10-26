'use client'

import { useEffect, useRef, useState } from 'react'
import {
    DEFAULT_INFINITE_GEN_FILTER,
    INFINITE_GEN_OPTIONS,
    INFINITE_GEN_VALUES,
    formatGenFilter,
} from '@/utils/genFilter'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'
type IdolCount = 5 | 10 | 15 | 20

interface ChallengeCreateModalProps {
    isOpen: boolean
    isCreating: boolean
    onClose: () => void
    onCreate: (idolCount: IdolCount, groupFilter: GroupFilter, genFilter: number[]) => void
}

const IDOL_COUNTS: IdolCount[] = [5, 10, 15, 20]
const GROUP_OPTIONS: { value: GroupFilter; label: string }[] = [
    { value: 'both', label: 'Both' },
    { value: 'boy-group', label: 'Boy groups' },
    { value: 'girl-group', label: 'Girl groups' },
]

export default function ChallengeCreateModal({
    isOpen,
    isCreating,
    onClose,
    onCreate,
}: ChallengeCreateModalProps) {
    const [selectedCount, setSelectedCount] = useState<IdolCount>(10)
    const [selectedFilter, setSelectedFilter] = useState<GroupFilter>('both')
    const [selectedGens, setSelectedGens] = useState<number[]>(DEFAULT_INFINITE_GEN_FILTER)
    const [countDropdownOpen, setCountDropdownOpen] = useState(false)
    const [groupDropdownOpen, setGroupDropdownOpen] = useState(false)
    const [genDropdownOpen, setGenDropdownOpen] = useState(false)

    const countDropdownRef = useRef<HTMLDivElement>(null)
    const groupDropdownRef = useRef<HTMLDivElement>(null)
    const genDropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (countDropdownRef.current && !countDropdownRef.current.contains(event.target as Node)) {
                setCountDropdownOpen(false)
            }
            if (groupDropdownRef.current && !groupDropdownRef.current.contains(event.target as Node)) {
                setGroupDropdownOpen(false)
            }
            if (genDropdownRef.current && !genDropdownRef.current.contains(event.target as Node)) {
                setGenDropdownOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (!isOpen) return null

    const handleCreate = () => {
        if (!isCreating && selectedGens.length > 0) {
            onCreate(selectedCount, selectedFilter, selectedGens)
        }
    }

    const toggleGen = (gen: number) => {
        setSelectedGens((prev) => {
            if (prev.includes(gen)) {
                if (prev.length === 1) return prev
                return prev.filter((value) => value !== gen)
            }
            return [...prev, gen].sort()
        })
    }

    const groupLabel = GROUP_OPTIONS.find((option) => option.value === selectedFilter)?.label ?? 'Both'
    const genLabel =
        selectedGens.length === INFINITE_GEN_VALUES.length
            ? 'All Gens'
            : formatGenFilter(selectedGens)

    return (
        <div className='fixed inset-0 z-[300] overflow-y-auto bg-black/40 p-4'>
            <div className='flex min-h-full items-center justify-center'>
            <div className='modal-fade-in relative w-full max-w-sm rounded-md bg-white p-8 dark:bg-zinc-900'>
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
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

                <div className='mb-4 flex items-center justify-center gap-2'>
                    <ChallengeIcon />
                    <h2 className='text-xl font-bold uppercase md:text-2xl'>Challenge mode</h2>
                </div>

                <div className='mb-6 bg-pink-100 p-3 text-sm'>
                    <p className='mb-2 text-lg text-gray-700 dark:text-zinc-800'>
                        <strong>How it works:</strong>
                    </p>
                    <ul className='space-y-1 text-sm text-gray-700 dark:text-zinc-800'>
                        <li className='flex items-start gap-2'>
                            <span>•</span>
                            <span>Choose the number of idols, group type and generation</span>
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

                <div className='mb-4'>
                    <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300'>
                        Number of Idols
                    </label>
                    <div ref={countDropdownRef} className='relative'>
                        <button
                            type='button'
                            onClick={() => {
                                setCountDropdownOpen(!countDropdownOpen)
                                setGroupDropdownOpen(false)
                                setGenDropdownOpen(false)
                            }}
                            className='flex w-full cursor-pointer items-center justify-between border-2 border-gray-200 bg-white px-3 py-2 text-left font-medium transition-all hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500'
                        >
                            <span>{selectedCount}</span>
                            <ChevronDownIcon className={`h-5 w-5 transition-transform ${countDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {countDropdownOpen && (
                            <div className='absolute z-10 mt-1 w-full border-2 border-gray-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
                                {IDOL_COUNTS.map((count) => (
                                    <button
                                        key={count}
                                        type='button'
                                        onClick={() => {
                                            setSelectedCount(count)
                                            setCountDropdownOpen(false)
                                        }}
                                        className={`w-full cursor-pointer px-3 py-2 text-left font-medium transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                                            selectedCount === count ? 'bg-gray-100 dark:bg-zinc-800' : ''
                                        }`}
                                    >
                                        {count}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className='mb-4'>
                    <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300'>
                        Group Type
                    </label>
                    <div ref={groupDropdownRef} className='relative'>
                        <button
                            type='button'
                            onClick={() => {
                                setGroupDropdownOpen(!groupDropdownOpen)
                                setCountDropdownOpen(false)
                                setGenDropdownOpen(false)
                            }}
                            className='flex w-full cursor-pointer items-center justify-between border-2 border-gray-200 bg-white px-3 py-2 text-left font-medium transition-all hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500'
                        >
                            <span>{groupLabel}</span>
                            <ChevronDownIcon className={`h-5 w-5 transition-transform ${groupDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {groupDropdownOpen && (
                            <div className='absolute z-10 mt-1 w-full border-2 border-gray-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
                                {GROUP_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type='button'
                                        onClick={() => {
                                            setSelectedFilter(option.value)
                                            setGroupDropdownOpen(false)
                                        }}
                                        className={`w-full cursor-pointer px-3 py-2 text-left font-medium transition-all hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                                            selectedFilter === option.value ? 'bg-gray-100 dark:bg-zinc-800' : ''
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className='mb-6'>
                    <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300'>
                        Generation
                    </label>
                    <div ref={genDropdownRef} className='relative'>
                        <button
                            type='button'
                            onClick={() => {
                                setGenDropdownOpen(!genDropdownOpen)
                                setCountDropdownOpen(false)
                                setGroupDropdownOpen(false)
                            }}
                            className='flex w-full cursor-pointer items-center justify-between border-2 border-gray-200 bg-white px-3 py-2 text-left font-medium transition-all hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500'
                        >
                            <span>{genLabel}</span>
                            <ChevronDownIcon className={`h-5 w-5 transition-transform ${genDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {genDropdownOpen && (
                            <div className='mt-1 max-h-40 w-full overflow-y-auto border-2 border-gray-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
                                {INFINITE_GEN_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type='button'
                                        onClick={() => toggleGen(option.value)}
                                        className='flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left font-medium transition-all hover:bg-gray-50 dark:hover:bg-zinc-800'
                                    >
                                        <div
                                            className={`flex h-5 w-5 items-center justify-center border-2 ${
                                                selectedGens.includes(option.value)
                                                    ? 'border-black bg-black'
                                                    : 'border-gray-300 bg-white dark:border-zinc-600 dark:bg-zinc-900'
                                            }`}
                                        >
                                            {selectedGens.includes(option.value) && (
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
                        onClick={handleCreate}
                        disabled={isCreating || selectedGens.length === 0}
                        className='w-[200px] cursor-pointer rounded-full bg-pink-600 px-4 py-2 font-bold text-white transition-all hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50'
                    >
                        {isCreating ? 'Creating...' : 'Create challenge'}
                    </button>
                </div>
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

function ChevronDownIcon({ className }: { className?: string }) {
    return (
        <svg xmlns='http://www.w3.org/2000/svg' className={className} viewBox='0 0 20 20' fill='currentColor'>
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
        <svg xmlns='http://www.w3.org/2000/svg' className={className} viewBox='0 0 20 20' fill='currentColor'>
            <path
                fillRule='evenodd'
                d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                clipRule='evenodd'
            />
        </svg>
    )
}
