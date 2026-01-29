'use client'

import { useState, useEffect, useCallback } from 'react'
import localFont from 'next/font/local'
import { getAvailableDailyDates } from '@/lib/supabase'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

interface HistoryModalProps {
    isOpen: boolean
    onClose: () => void
    onSelectDate: (date: string) => void
    onBack: () => void
}

const DAYS = ['Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

export default function HistoryModal({
    isOpen,
    onClose,
    onSelectDate,
    onBack,
}: HistoryModalProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())
    const [firstAvailableDate, setFirstAvailableDate] = useState<string | null>(null)
    const [lastAvailableDate, setLastAvailableDate] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true)
            getAvailableDailyDates().then(({ dates, firstDate, lastDate }) => {
                setAvailableDates(new Set(dates))
                setFirstAvailableDate(firstDate)
                setLastAvailableDate(lastDate)
                setIsLoading(false)
            })
        }
    }, [isOpen])

    const formatDateString = (date: Date): string => {
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }

    const getDaysInMonth = (date: Date): Date[] => {
        const year = date.getFullYear()
        const month = date.getMonth()
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        
        const days: Date[] = []
        
        for (let i = 0; i < firstDay.getDay(); i++) {
            const prevDate = new Date(year, month, -firstDay.getDay() + i + 1)
            days.push(prevDate)
        }
        
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i))
        }
        
        const remainingDays = 42 - days.length // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            days.push(new Date(year, month + 1, i))
        }
        
        return days
    }

    const isCurrentMonth = (date: Date): boolean => {
        return date.getMonth() === currentMonth.getMonth() &&
               date.getFullYear() === currentMonth.getFullYear()
    }

    const isToday = (date: Date): boolean => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear()
    }

    const canGoToPreviousMonth = useCallback((): boolean => {
        if (!firstAvailableDate) return false
        const firstDate = new Date(firstAvailableDate)
        const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
        return prevMonth >= new Date(firstDate.getFullYear(), firstDate.getMonth(), 1)
    }, [currentMonth, firstAvailableDate])

    const canGoToNextMonth = useCallback((): boolean => {
        if (!lastAvailableDate) return false
        const lastDate = new Date(lastAvailableDate)
        const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        return nextMonth <= new Date(lastDate.getFullYear(), lastDate.getMonth(), 1)
    }, [currentMonth, lastAvailableDate])

    const handlePreviousMonth = () => {
        if (canGoToPreviousMonth()) {
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
        }
    }

    const handleNextMonth = () => {
        if (canGoToNextMonth()) {
            setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
        }
    }

    const handleDateClick = (date: Date) => {
        const dateString = formatDateString(date)
        if (availableDates.has(dateString)) {
            onSelectDate(dateString)
        }
    }

    if (!isOpen) return null

    const days = getDaysInMonth(currentMonth)

    return (
        <div className='bg-opacity-50 fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6'>
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                    aria-label='Close History'
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

                <div className='mb-6 flex items-center gap-2'>
                    <button
                        onClick={onBack}
                        className='flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-100 px-3 transition-colors hover:bg-gray-200'
                        aria-label='Go back'
                    >
                        <ArrowLeftIcon />
                        <span className='text-sm text-gray-600'>Go back</span>
                    </button>
                </div>

                <h1 className={`${proximaNovaBold.className} text-2xl uppercase`}>
                    Past Idols
                </h1>
                <p className='mt-2 text-gray-600'>
                    Select a date to play that day&apos;s idol.
                </p>

                {isLoading ? (
                    <div className='mt-6 flex h-64 items-center justify-center'>
                        <div className='h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-pink-500' />
                    </div>
                ) : (
                    <div className='mt-6'>
                        {/* Calendar Header */}
                        <div className='mb-4 flex items-center justify-between'>
                            <button
                                onClick={handlePreviousMonth}
                                disabled={!canGoToPreviousMonth()}
                                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                                    canGoToPreviousMonth()
                                        ? 'cursor-pointer bg-gray-100 hover:bg-gray-200'
                                        : 'cursor-not-allowed bg-gray-50 opacity-50'
                                }`}
                                aria-label='Previous month'
                            >
                                <ChevronLeftIcon />
                            </button>
                            <h2 className={`${proximaNovaBold.className} text-lg`}>
                                {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                            </h2>
                            <button
                                onClick={handleNextMonth}
                                disabled={!canGoToNextMonth()}
                                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                                    canGoToNextMonth()
                                        ? 'cursor-pointer bg-gray-100 hover:bg-gray-200'
                                        : 'cursor-not-allowed bg-gray-50 opacity-50'
                                }`}
                                aria-label='Next month'
                            >
                                <ChevronRightIcon />
                            </button>
                        </div>

                        {/* Day Headers */}
                        <div className='mb-2 grid grid-cols-7 gap-1'>
                            {DAYS.map((day) => (
                                <div
                                    key={day}
                                    className='py-2 text-center text-xs font-medium text-gray-500'
                                >
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className='grid grid-cols-7 gap-1'>
                            {days.map((date, index) => {
                                const dateString = formatDateString(date)
                                const isAvailable = availableDates.has(dateString)
                                const inCurrentMonth = isCurrentMonth(date)
                                const isTodayDate = isToday(date)

                                return (
                                    <button
                                        key={index}
                                        onClick={() => handleDateClick(date)}
                                        disabled={!isAvailable}
                                        className={`relative flex h-10 w-full items-center justify-center rounded-lg text-sm transition-colors ${
                                            !inCurrentMonth
                                                ? 'text-gray-300'
                                                : isAvailable
                                                ? 'cursor-pointer bg-pink-50 font-medium text-pink-600 hover:bg-pink-100'
                                                : 'cursor-not-allowed text-gray-400'
                                        } ${
                                            isTodayDate && inCurrentMonth
                                                ? 'ring-2 ring-pink-400 ring-offset-1'
                                                : ''
                                        }`}
                                        aria-label={`${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}${isAvailable ? ' - available' : ''}`}
                                    >
                                        {date.getDate()}
                                        {isAvailable && inCurrentMonth && (
                                            <span className='absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-pink-400' />
                                        )}
                                    </button>
                                )
                            })}
                        </div>

                        <p className='mt-4 text-center text-xs text-gray-400'>
                            Highlighted dates have past idols available to play
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

function ArrowLeftIcon() {
    return (
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
                d='M10 19l-7-7m0 0l7-7m-7 7h18'
            />
        </svg>
    )
}

function ChevronLeftIcon() {
    return (
        <svg
            className='h-5 w-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
            />
        </svg>
    )
}

function ChevronRightIcon() {
    return (
        <svg
            className='h-5 w-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
            />
        </svg>
    )
}
