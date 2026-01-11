'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback } from 'react'

export interface DailyCompletion {
    date: string
    imageId: number
    completed: boolean
    won: boolean
    guessCount: number
    correctAnswer: string
    guessAttempts?: string[]
}

export interface DailyProgress {
    date: string
    imageId: number
    guesses: Array<'correct' | 'incorrect' | 'empty'>
}

export interface UserStats {
    totalGames: number
    totalWins: number
    currentStreak: number
    maxStreak: number
    guessDistribution: { [key: number]: number }
    lastPlayedDate: string
    todayCompleted: boolean
    dailyCompletions: { [key: string]: DailyCompletion }
}

export interface UnlimitedStats {
    totalGames: number
    totalWins: number
    currentStreak: number
    maxStreak: number
}

export interface UnlimitedGameState {
    groupType: string
    imgBucket: string
    groupCategory?: string
    base64Group?: string
    base64Idol?: string
    encodedIdolName: string
    encodedAltName?: string
    groupName?: string
    hintUsed?: boolean
    hintUsedOnIdol?: string
    skipsRemaining?: number
    guesses: Array<'correct' | 'incorrect' | 'empty'>
    savedAt: string
    prefetchedImages?: Array<{
        id: number
        name: string
        alt_name?: string
        group_type: string
        img_bucket: string
        group_category?: string
        base64_group?: string
        base64_idol?: string
        group_name?: string
    }>
    currentImageIndex?: number
}

export interface HangulStats {
    totalGames: number
    totalWins: number
    currentStreak: number
    maxStreak: number
}

export interface HangulGameState {
    groupType: string
    imgBucket: string
    groupCategory?: string
    base64Group?: string
    base64Idol?: string
    encodedIdolName: string
    encodedAltName?: string
    hangulName: string
    groupName?: string
    imageRevealed?: boolean
    skipsRemaining?: number
    guesses: Array<'correct' | 'incorrect' | 'empty'>
    savedAt: string
    prefetchedImages?: Array<{
        id: number
        name: string
        alt_name?: string
        hangul_name: string
        group_type: string
        img_bucket: string
        group_category?: string
        base64_group?: string
        base64_idol?: string
        group_name?: string
    }>
    currentImageIndex?: number
}

const defaultStats: UserStats = {
    totalGames: 0,
    totalWins: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
    lastPlayedDate: '',
    todayCompleted: false,
    dailyCompletions: {},
}

const defaultUnlimitedStats: UnlimitedStats = {
    totalGames: 0,
    totalWins: 0,
    currentStreak: 0,
    maxStreak: 0,
}

const defaultHangulStats: HangulStats = {
    totalGames: 0,
    totalWins: 0,
    currentStreak: 0,
    maxStreak: 0,
}

export function useUserStats() {
    const [stats, setStats] = useState<UserStats>(defaultStats)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const loadStats = () => {
            try {
                const savedStats = localStorage.getItem('idol-guessr-stats')
                if (savedStats) {
                    const parsedStats = JSON.parse(savedStats)
                    const today = new Date().toDateString()
                    const lastPlayed = parsedStats.lastPlayedDate
                    if (lastPlayed !== today) {
                        parsedStats.todayCompleted = false
                    }
                    if (!parsedStats.dailyCompletions) {
                        parsedStats.dailyCompletions = {}
                    }
                    setStats(parsedStats)
                }
            } catch (error) {
                console.error('Error loading stats from localStorage:', error)
                setStats(defaultStats)
            } finally {
                setIsLoaded(true)
            }
        }
        loadStats()
    }, [])

    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem('idol-guessr-stats', JSON.stringify(stats))
            } catch (error) {
                console.error('Error saving stats to localStorage:', error)
            }
        }
    }, [stats, isLoaded])

    const updateStats = (
        won: boolean,
        guessCount: number,
        imageId?: number,
        correctAnswer?: string,
        guessAttempts?: string[]
    ) => {
        const today = new Date().toDateString()
        setStats((prevStats) => {
            if (prevStats.dailyCompletions[today]?.completed) {
                return prevStats
            }
            const newStats = {
                ...prevStats,
                guessDistribution: { ...prevStats.guessDistribution },
                dailyCompletions: { ...prevStats.dailyCompletions },
            }
            newStats.totalGames += 1
            newStats.lastPlayedDate = today
            newStats.todayCompleted = true
            if (imageId && correctAnswer) {
                newStats.dailyCompletions[today] = {
                    date: today,
                    imageId,
                    completed: true,
                    won,
                    guessCount: won ? guessCount : 0,
                    correctAnswer,
                    guessAttempts: guessAttempts || [],
                }
            }
            if (won) {
                newStats.totalWins += 1
                newStats.guessDistribution[guessCount] += 1
                if (
                    prevStats.lastPlayedDate === today ||
                    new Date(prevStats.lastPlayedDate).getTime() === new Date(today).getTime() - 86400000
                ) {
                    newStats.currentStreak += 1
                } else {
                    newStats.currentStreak = 1
                }
                newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak)
            } else {
                newStats.currentStreak = 0
            }
            return newStats
        })
    }

    const getTodayCompletion = useCallback((): DailyCompletion | null => {
        const today = new Date().toDateString()
        return stats.dailyCompletions[today] || null
    }, [stats.dailyCompletions])

    const isTodayCompleted = useCallback((): boolean => {
        const today = new Date().toDateString()
        return stats.dailyCompletions[today]?.completed || false
    }, [stats.dailyCompletions])

    const saveDailyProgress = useCallback((imageId: number, guesses: Array<'correct' | 'incorrect' | 'empty'>) => {
        if (typeof window === 'undefined') return
        try {
            const today = new Date().toDateString()
            const progress: DailyProgress = { date: today, imageId, guesses }
            localStorage.setItem('idol-guessr-daily-progress', JSON.stringify(progress))
        } catch (error) {
            console.error('Error saving daily progress:', error)
        }
    }, [])

    const loadDailyProgress = useCallback((): DailyProgress | null => {
        if (typeof window === 'undefined') return null
        try {
            const today = new Date().toDateString()
            const savedProgress = localStorage.getItem('idol-guessr-daily-progress')
            if (savedProgress) {
                const progress: DailyProgress = JSON.parse(savedProgress)
                if (progress.date === today) {
                    return progress
                }
            }
        } catch (error) {
            console.error('Error loading daily progress:', error)
        }
        return null
    }, [])

    const clearDailyProgress = useCallback(() => {
        if (typeof window === 'undefined') return
        try {
            localStorage.removeItem('idol-guessr-daily-progress')
        } catch (error) {
            console.error('Error clearing daily progress:', error)
        }
    }, [])

    const saveGuessAttempt = useCallback((guess: string) => {
        if (typeof window === 'undefined') return
        try {
            const today = new Date().toDateString()
            const key = `idol-guessr-guess-attempts-${today}`
            const existingAttempts = localStorage.getItem(key)
            const attempts = existingAttempts ? JSON.parse(existingAttempts) : []
            attempts.push(guess)
            localStorage.setItem(key, JSON.stringify(attempts))
        } catch (error) {
            console.error('Error saving guess attempt:', error)
        }
    }, [])

    const loadGuessAttempts = useCallback((): string[] => {
        if (typeof window === 'undefined') return []
        try {
            const today = new Date().toDateString()
            const key = `idol-guessr-guess-attempts-${today}`
            const attempts = localStorage.getItem(key)
            return attempts ? JSON.parse(attempts) : []
        } catch (error) {
            console.error('Error loading guess attempts:', error)
            return []
        }
    }, [])

    return {
        stats,
        isLoaded,
        updateStats,
        getTodayCompletion,
        isTodayCompleted,
        saveDailyProgress,
        loadDailyProgress,
        clearDailyProgress,
        saveGuessAttempt,
        loadGuessAttempts,
    }
}

export function useUnlimitedStats() {
    const [stats, setStats] = useState<UnlimitedStats>(defaultUnlimitedStats)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const loadStats = () => {
            try {
                const savedStats = localStorage.getItem('idol-guessr-unlimited-stats')
                if (savedStats) {
                    setStats(JSON.parse(savedStats))
                } else {
                    setStats(defaultUnlimitedStats)
                }
            } catch (error) {
                console.error('Error loading unlimited stats:', error)
                setStats(defaultUnlimitedStats)
            } finally {
                setIsLoaded(true)
            }
        }
        loadStats()
    }, [])

    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem('idol-guessr-unlimited-stats', JSON.stringify(stats))
            } catch (error) {
                console.error('Error saving unlimited stats:', error)
            }
        }
    }, [stats, isLoaded])

    const updateStats = (won: boolean, incrementTotalGames: boolean = true, preserveStreak: boolean = false) => {
        setStats((prevStats) => {
            const newStats = { ...prevStats }
            if (incrementTotalGames) {
                newStats.totalGames += 1
            }
            if (won) {
                newStats.totalWins += 1
                newStats.currentStreak += 1
                newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak)
            } else {
                if (!preserveStreak) {
                    newStats.currentStreak = 0
                }
            }
            return newStats
        })
    }

    const saveGameState = useCallback((gameState: UnlimitedGameState) => {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem('idol-guessr-unlimited-game-state', JSON.stringify(gameState))
        } catch (error) {
            console.error('Error saving unlimited game state:', error)
        }
    }, [])

    const loadGameState = useCallback((): UnlimitedGameState | null => {
        if (typeof window === 'undefined') return null
        try {
            const savedState = localStorage.getItem('idol-guessr-unlimited-game-state')
            if (savedState) {
                return JSON.parse(savedState) as UnlimitedGameState
            }
        } catch (error) {
            console.error('Error loading unlimited game state:', error)
        }
        return null
    }, [])

    const clearGameState = useCallback(() => {
        if (typeof window === 'undefined') return
        try {
            localStorage.removeItem('idol-guessr-unlimited-game-state')
        } catch (error) {
            console.error('Error clearing unlimited game state:', error)
        }
    }, [])

    return { stats, isLoaded, updateStats, saveGameState, loadGameState, clearGameState }
}

export function useHangulStats() {
    const [stats, setStats] = useState<HangulStats>(defaultHangulStats)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const loadStats = () => {
            try {
                const savedStats = localStorage.getItem('idol-guessr-hangul-stats')
                if (savedStats) {
                    setStats(JSON.parse(savedStats))
                } else {
                    setStats(defaultHangulStats)
                }
            } catch (error) {
                console.error('Error loading hangul stats:', error)
                setStats(defaultHangulStats)
            } finally {
                setIsLoaded(true)
            }
        }
        loadStats()
    }, [])

    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem('idol-guessr-hangul-stats', JSON.stringify(stats))
            } catch (error) {
                console.error('Error saving hangul stats:', error)
            }
        }
    }, [stats, isLoaded])

    const updateStats = (won: boolean, incrementTotalGames: boolean = true, preserveStreak: boolean = false) => {
        setStats((prevStats) => {
            const newStats = { ...prevStats }
            if (incrementTotalGames) {
                newStats.totalGames += 1
            }
            if (won) {
                newStats.totalWins += 1
                newStats.currentStreak += 1
                newStats.maxStreak = Math.max(newStats.maxStreak, newStats.currentStreak)
            } else {
                if (!preserveStreak) {
                    newStats.currentStreak = 0
                }
            }
            return newStats
        })
    }

    const saveGameState = useCallback((gameState: HangulGameState) => {
        if (typeof window === 'undefined') return
        try {
            localStorage.setItem('idol-guessr-hangul-game-state', JSON.stringify(gameState))
        } catch (error) {
            console.error('Error saving hangul game state:', error)
        }
    }, [])

    const loadGameState = useCallback((): HangulGameState | null => {
        if (typeof window === 'undefined') return null
        try {
            const savedState = localStorage.getItem('idol-guessr-hangul-game-state')
            if (savedState) {
                return JSON.parse(savedState) as HangulGameState
            }
        } catch (error) {
            console.error('Error loading hangul game state:', error)
        }
        return null
    }, [])

    const clearGameState = useCallback(() => {
        if (typeof window === 'undefined') return
        try {
            localStorage.removeItem('idol-guessr-hangul-game-state')
        } catch (error) {
            console.error('Error clearing hangul game state:', error)
        }
    }, [])

    return { stats, isLoaded, updateStats, saveGameState, loadGameState, clearGameState }
}

interface UserStatsProps {
    stats: UserStats | UnlimitedStats | HangulStats
    isLoaded: boolean
    className?: string
    gameMode?: 'daily' | 'unlimited' | 'hangul'
}

export default function UserStats({ stats, isLoaded, className = '', gameMode = 'daily' }: UserStatsProps) {
    if (!isLoaded) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className='rounded-lg bg-gray-200 p-4'>
                    <div className='mb-2 h-4 rounded bg-gray-300'></div>
                    <div className='mb-2 h-4 rounded bg-gray-300'></div>
                    <div className='h-4 rounded bg-gray-300'></div>
                </div>
            </div>
        )
    }
    const winPercentage = stats.totalGames > 0 ? Math.round((stats.totalWins / stats.totalGames) * 100) : 0
    const isUnlimited = gameMode === 'unlimited'
    const isHangul = gameMode === 'hangul'
    const hasGuessDistribution = 'guessDistribution' in stats
    const getTitle = () => {
        if (isUnlimited) return 'Infinite Statistics'
        if (isHangul) return 'Hangul Statistics'
        return 'Statistics'
    }
    return (
        <div className={`rounded-lg bg-white p-10 shadow-lg ${className}`}>
            <div className='mb-10 flex items-center justify-center'>
                <Image src='/images/idolguessr-logo.png' alt='IdolGuessr Logo' width={150} height={50} className='h-20 w-auto' />
            </div>
            <div className='mb-4 flex items-center justify-center'>
                <h2 className='text-2xl font-bold text-gray-900 uppercase'>
                    {getTitle()}
                </h2>
            </div>
            <div className='mb-6 flex flex-row justify-center gap-4'>
                <div className='text-center'>
                    <div className='mb-2.5 text-2xl font-bold text-gray-900'>{stats.totalGames}</div>
                    <div className='text-sm leading-none text-gray-600'>Played</div>
                </div>
                {!isUnlimited && !isHangul && (
                    <div className='text-center'>
                        <div className='mb-2.5 text-2xl font-bold text-gray-900'>{winPercentage}%</div>
                        <div className='text-sm leading-none text-gray-600'>Win %</div>
                    </div>
                )}
                <div className='text-center'>
                    <div className='mb-2.5 text-2xl font-bold text-gray-900'>{stats.currentStreak}</div>
                    <div className='text-sm leading-none text-gray-600'>Current streak</div>
                </div>
                <div className='text-center'>
                    <div className='mb-2.5 text-2xl font-bold text-gray-900'>{stats.maxStreak}</div>
                    <div className='text-sm leading-none text-gray-600'>Max streak</div>
                </div>
            </div>
            {!isUnlimited && !isHangul && hasGuessDistribution && stats.totalWins > 0 && (
                <>
                    <h3 className='mb-3 text-lg font-semibold text-gray-900 uppercase'>Guess distribution</h3>
                    <div className='space-y-2'>
                        {Object.entries((stats as UserStats).guessDistribution).map(([guesses, count]) => {
                            const percentage = stats.totalWins > 0 ? (count / stats.totalWins) * 100 : 0
                            return (
                                <div key={guesses} className='flex items-center'>
                                    <div className='w-4 text-sm font-medium text-black'>{guesses}</div>
                                    <div className='relative mx-2 h-6 flex-1 rounded-full bg-gray-200'>
                                        <div className='flex h-6 items-center justify-end rounded-full bg-green-400 pr-2' style={{ width: `${Math.min(Math.max(percentage, 8), 100)}%` }}>
                                            {count > 0 && <span className='text-xs font-bold text-white'>{count}</span>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    )
}


