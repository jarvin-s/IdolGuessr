'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    useUserStats,
    type DailyCompletion,
} from '@/components/stats/UserStats'

interface GameProgressHook {
    guesses: Array<'correct' | 'incorrect' | 'empty'>
    setGuesses: React.Dispatch<
        React.SetStateAction<Array<'correct' | 'incorrect' | 'empty'>>
    >
    gameWon: boolean
    setGameWon: React.Dispatch<React.SetStateAction<boolean>>
    gameLost: boolean
    setGameLost: React.Dispatch<React.SetStateAction<boolean>>
    todayCompleted: boolean
    todayCompletionData: DailyCompletion | null
    stats: ReturnType<typeof useUserStats>['stats']
    statsLoaded: boolean
    handleGameWin: (guessNumber: number, revealedName?: string) => void
    handleGameLoss: (revealedName?: string) => void
    saveProgress: (newGuesses: Array<'correct' | 'incorrect' | 'empty'>) => void
    saveGuessAttempt: (guess: string) => void
    loadGuessAttempts: () => string[]
}

export function useGameProgress(
    dailyImage: { id: number } | null,
    correctAnswer: string,
    gameMode: 'daily' | 'unlimited' = 'daily'
): GameProgressHook {
    const [guesses, setGuesses] = useState<
        Array<'correct' | 'incorrect' | 'empty'>
    >(['empty', 'empty', 'empty', 'empty', 'empty', 'empty'])
    const [gameWon, setGameWon] = useState(false)
    const [gameLost, setGameLost] = useState(false)
    const [todayCompleted, setTodayCompleted] = useState(false)
    const [todayCompletionData, setTodayCompletionData] =
        useState<DailyCompletion | null>(null)

    const {
        stats,
        isLoaded: statsLoaded,
        updateStats,
        getTodayCompletion,
        isTodayCompleted,
        saveDailyProgress,
        loadDailyProgress,
        clearDailyProgress,
        saveGuessAttempt,
        loadGuessAttempts,
    } = useUserStats()

    useEffect(() => {
        if (gameMode !== 'daily') {
            return
        }

        if (!statsLoaded || !dailyImage) {
            return
        }

        setGameWon(false)
        setGameLost(false)
        setTodayCompleted(false)
        setTodayCompletionData(null)

        const completed = isTodayCompleted()
        const completionData = getTodayCompletion()

        if (completed && completionData && completionData.imageId === dailyImage.id) {
            setTodayCompleted(true)
            setTodayCompletionData(completionData)

            if (completionData.won) {
                setGameWon(true)
                const newGuesses: Array<
                    'correct' | 'incorrect' | 'empty'
                > = [
                        'empty',
                        'empty',
                        'empty',
                        'empty',
                        'empty',
                        'empty',
                    ]
                for (
                    let i = 0;
                    i < completionData.guessCount - 1;
                    i++
                ) {
                    newGuesses[i] = 'incorrect'
                }
                newGuesses[completionData.guessCount - 1] = 'correct'
                setGuesses(newGuesses)
            } else {
                setGameLost(true)
                setGuesses([
                    'incorrect',
                    'incorrect',
                    'incorrect',
                    'incorrect',
                    'incorrect',
                    'incorrect',
                ])
            }
        } else {
            const progress = loadDailyProgress()
            if (progress && progress.imageId === dailyImage.id) {
                setGuesses(progress.guesses)
            } else {
                setGuesses(['empty', 'empty', 'empty', 'empty', 'empty', 'empty'])
            }
        }
    }, [
        gameMode,
        statsLoaded,
        dailyImage,
        isTodayCompleted,
        getTodayCompletion,
        loadDailyProgress,
    ])

    const handleGameWin = useCallback(
        (guessNumber: number, revealedName?: string) => {
            const attempts = loadGuessAttempts()
            updateStats(
                true,
                guessNumber,
                dailyImage?.id,
                revealedName || correctAnswer,
                attempts
            )
            clearDailyProgress()
        },
        [updateStats, dailyImage, correctAnswer, clearDailyProgress, loadGuessAttempts]
    )

    const handleGameLoss = useCallback(
        (revealedName?: string) => {
            const attempts = loadGuessAttempts()
            updateStats(
                false,
                0,
                dailyImage?.id,
                revealedName || correctAnswer,
                attempts
            )
            clearDailyProgress()
        }, [updateStats, dailyImage, correctAnswer, clearDailyProgress, loadGuessAttempts])

    const saveProgress = useCallback(
        (newGuesses: Array<'correct' | 'incorrect' | 'empty'>) => {
            if (dailyImage?.id) {
                saveDailyProgress(dailyImage.id, newGuesses)
            }
        },
        [dailyImage, saveDailyProgress]
    )

    return {
        guesses,
        setGuesses,
        gameWon,
        setGameWon,
        gameLost,
        setGameLost,
        todayCompleted,
        todayCompletionData,
        stats,
        statsLoaded,
        handleGameWin,
        handleGameLoss,
        saveProgress,
        saveGuessAttempt,
        loadGuessAttempts,
    }
}

