'use client'

import Image from 'next/image'
import { useState, useEffect, useCallback, useMemo } from 'react'
import type { InfiniteDifficulty, ImageMode } from '@/utils/difficulty'
import {
    focusIssuedIdol,
    getDailyAttempts,
    getDailyProgress,
    getDailyStats,
    getHangulGame,
    getHangulStats,
    getUnlimitedGame,
    getUnlimitedStats,
    playerReady,
    releaseRound,
    subscribePlayer,
} from '@/lib/player'

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
    zoomX?: number | null
    zoomY?: number | null
    difficulty?: InfiniteDifficulty
    hintUsed?: boolean
    hintsRemaining?: number
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
        zoom_x?: number | null
        zoom_y?: number | null
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
    idolId?: number
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
        const sync = () => {
            setStats(playerReady() ? getDailyStats() : defaultStats)
            setIsLoaded(playerReady())
        }
        sync()
        const unsubscribe = subscribePlayer(sync)
        return () => {
            unsubscribe()
        }
    }, [])

    const updateStats = (
        won: boolean,
        guessCount: number,
        imageId?: number,
        correctAnswer?: string,
        guessAttempts?: string[]
    ) => {
        const today = new Date().toDateString()
        const server = getDailyStats()
        if (imageId && correctAnswer) {
            server.dailyCompletions[today] = {
                date: today,
                imageId,
                completed: true,
                won,
                guessCount: won ? guessCount : 0,
                correctAnswer,
                guessAttempts: guessAttempts || server.dailyCompletions[today]?.guessAttempts || [],
            }
            server.todayCompleted = true
        }
        setStats(server)
    }

    const getTodayCompletion = useCallback((): DailyCompletion | null => {
        const today = new Date().toDateString()
        return stats.dailyCompletions[today] || null
    }, [stats.dailyCompletions])

    const isTodayCompleted = useCallback((): boolean => {
        const today = new Date().toDateString()
        return stats.dailyCompletions[today]?.completed || false
    }, [stats.dailyCompletions])

    const saveDailyProgress = useCallback(() => {
        // Guesses are stored by submit_daily_guess.
    }, [])

    const loadDailyProgress = useCallback((): DailyProgress | null => {
        return getDailyProgress()
    }, [])

    const clearDailyProgress = useCallback(() => {
        // The finished daily row stays on the server.
    }, [])

    const saveGuessAttempt = useCallback(() => {
        // The server appends the guess.
    }, [])

    const loadGuessAttempts = useCallback((): string[] => {
        return getDailyAttempts()
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


export function loadUnlimitedStats(difficulty: InfiniteDifficulty, mode: ImageMode = 'pixelated'): UnlimitedStats {
    if (!playerReady()) return defaultUnlimitedStats
    return getUnlimitedStats(difficulty, mode)
}

export function useUnlimitedStats(difficulty: InfiniteDifficulty = 'normal', mode: ImageMode = 'pixelated') {
    const [stats, setStats] = useState<UnlimitedStats>(defaultUnlimitedStats)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const sync = () => {
            setStats(playerReady() ? getUnlimitedStats(difficulty, mode) : defaultUnlimitedStats)
            setIsLoaded(playerReady())
        }
        sync()
        const unsubscribe = subscribePlayer(sync)
        return () => {
            unsubscribe()
        }
    }, [difficulty, mode])

    const updateStats = useCallback(() => {
        setStats(getUnlimitedStats(difficulty, mode))
    }, [difficulty, mode])

    const saveGameState = useCallback((gameState: UnlimitedGameState, forDifficulty?: InfiniteDifficulty, forMode?: ImageMode) => {
        if (!gameState.imgBucket) return
        void focusIssuedIdol('unlimited', gameState.imgBucket, forDifficulty ?? difficulty, forMode ?? mode)
    }, [difficulty, mode])

    const loadGameState = useCallback((forDifficulty?: InfiniteDifficulty, forMode?: ImageMode): UnlimitedGameState | null => {
        return getUnlimitedGame(forDifficulty ?? difficulty, forMode ?? mode)
    }, [difficulty, mode])

    const clearGameState = useCallback((forDifficulty?: InfiniteDifficulty, forMode?: ImageMode) => {
        void releaseRound('unlimited', forDifficulty ?? difficulty, forMode ?? mode)
    }, [difficulty, mode])

    return useMemo(
        () => ({ stats, isLoaded, updateStats, saveGameState, loadGameState, clearGameState }),
        [stats, isLoaded, updateStats, saveGameState, loadGameState, clearGameState],
    )
}

export function useHangulStats() {
    const [stats, setStats] = useState<HangulStats>(defaultHangulStats)
    const [isLoaded, setIsLoaded] = useState(false)

    useEffect(() => {
        const sync = () => {
            setStats(playerReady() ? getHangulStats() : defaultHangulStats)
            setIsLoaded(playerReady())
        }
        sync()
        const unsubscribe = subscribePlayer(sync)
        return () => {
            unsubscribe()
        }
    }, [])

    const updateStats = useCallback(() => {
        setStats(getHangulStats())
    }, [])

    const saveGameState = useCallback((gameState: HangulGameState) => {
        const key = gameState.idolId && gameState.idolId > 0
            ? String(gameState.idolId)
            : gameState.imgBucket
        if (!key) return
        void focusIssuedIdol('hangul', key)
    }, [])

    const loadGameState = useCallback((): HangulGameState | null => {
        return getHangulGame()
    }, [])

    const clearGameState = useCallback(() => {
        void releaseRound('hangul')
    }, [])

    return useMemo(
        () => ({ stats, isLoaded, updateStats, saveGameState, loadGameState, clearGameState }),
        [stats, isLoaded, updateStats, saveGameState, loadGameState, clearGameState],
    )
}

interface UserStatsProps {
    stats: UserStats | UnlimitedStats | HangulStats
    isLoaded: boolean
    className?: string
    gameMode?: 'daily' | 'unlimited' | 'hangul'
    subHeader?: React.ReactNode
}

export default function UserStats({ stats, isLoaded, className = '', gameMode = 'daily', subHeader }: UserStatsProps) {
    if (!isLoaded) {
        return (
            <div className={`animate-pulse ${className}`}>
                <div className='rounded-lg bg-gray-200 dark:bg-zinc-800 p-4'>
                    <div className='mb-2 h-4 rounded bg-gray-300 dark:bg-zinc-700'></div>
                    <div className='mb-2 h-4 rounded bg-gray-300 dark:bg-zinc-700'></div>
                    <div className='h-4 rounded bg-gray-300 dark:bg-zinc-700'></div>
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
        <div className={`rounded-lg bg-white dark:bg-zinc-900 p-10 shadow-lg ${className}`}>
            <div className='mb-10 flex items-center justify-center'>
                <Image src='/images/idolguessr-logo.webp' alt='IdolGuessr Logo' width={150} height={50} className='h-20 w-auto dark:invert' />
            </div>
            <div className='mb-4 flex items-center justify-center'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-zinc-100 uppercase'>
                    {getTitle()}
                </h2>
            </div>
            {subHeader}
            <div className='mb-6 flex flex-row justify-center gap-4'>
                <div className='text-center'>
                    <div className='mb-2.5 text-2xl font-bold text-gray-900 dark:text-zinc-100'>{stats.totalGames}</div>
                    <div className='text-sm leading-none text-gray-600 dark:text-zinc-400'>Played</div>
                </div>
                {!isUnlimited && !isHangul && (
                    <div className='text-center'>
                        <div className='mb-2.5 text-2xl font-bold text-gray-900 dark:text-zinc-100'>{winPercentage}%</div>
                        <div className='text-sm leading-none text-gray-600 dark:text-zinc-400'>Win %</div>
                    </div>
                )}
                <div className='text-center'>
                    <div className='mb-2.5 text-2xl font-bold text-gray-900 dark:text-zinc-100'>{stats.currentStreak}</div>
                    <div className='text-sm leading-none text-gray-600 dark:text-zinc-400'>Current streak</div>
                </div>
                <div className='text-center'>
                    <div className='mb-2.5 text-2xl font-bold text-gray-900 dark:text-zinc-100'>{stats.maxStreak}</div>
                    <div className='text-sm leading-none text-gray-600 dark:text-zinc-400'>Max streak</div>
                </div>
            </div>
            {!isUnlimited && !isHangul && hasGuessDistribution && stats.totalWins > 0 && (
                <>
                    <h3 className='mb-3 text-lg font-semibold text-gray-900 dark:text-zinc-100 uppercase'>Guess distribution</h3>
                    <div className='space-y-2'>
                        {Object.entries((stats as UserStats).guessDistribution).map(([guesses, count]) => {
                            const percentage = stats.totalWins > 0 ? (count / stats.totalWins) * 100 : 0
                            return (
                                <div key={guesses} className='flex items-center'>
                                    <div className='w-4 text-sm font-medium text-black dark:text-zinc-100'>{guesses}</div>
                                    <div className='relative mx-2 h-6 flex-1 rounded-full bg-gray-200 dark:bg-zinc-800'>
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


