'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
    fetchCurrentDaily,
    fetchUnlimitedIdols,
    fetchGroupHint,
    submitIdolGuess,
    addSeenIdolId,
    clearSeenIdolIds,
    fromStoredIdol,
    toStoredIdol,
    type PlayIdol,
} from '@/lib/gameApi'
import {
    trackDailyGameEnd,
    trackUnlimitedGame,
    resetGuessTimer,
} from '@/lib/supabase'
import { useGameProgress } from '@/hooks/useGameProgress'
import { useUnlimitedStats } from '@/components/stats/UserStats'
import {
    emptyGuesses,
    getDifficultyConfig,
    saveDifficulty,
    type InfiniteDifficulty,
} from '@/utils/difficulty'
import {
    DEFAULT_INFINITE_GEN_FILTER,
    isValidInfiniteGenFilter,
} from '@/utils/genFilter'
import idolNames from '@/data/idolNames.json'

function restoredHints(
    saved: { hintsRemaining?: number; hintUsed?: boolean } | null | undefined,
    hintCount: number
): number {
    if (!saved) return hintCount
    if (typeof saved.hintsRemaining === 'number') return saved.hintsRemaining
    if (saved.hintUsed) return 0
    return hintCount
}

const idolNamesSet = new Set(
    idolNames.map((name: string) => name.toUpperCase())
)

export function useGameController() {
    const pathname = usePathname()
    const [gameMode, setGameMode] = useState<'daily' | 'unlimited'>('daily')
    const [currentGuess, setCurrentGuess] = useState('')
    const [lastIncorrectGuess, setLastIncorrectGuess] = useState('')
    const [dailyImage, setDailyImage] = useState<PlayIdol | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAnimating, setIsAnimating] = useState(false)
    const [correctAnswer, setCorrectAnswer] = useState('')
    const [showConfetti, setShowConfetti] = useState(false)
    const [showStats, setShowStats] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)
    const [showWinModal, setShowWinModal] = useState(false)
    const [windowDimensions, setWindowDimensions] = useState({
        width: 0,
        height: 0,
    })
    const [prefetchedImages, setPrefetchedImages] = useState<PlayIdol[]>([])
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showStreakPopup, setShowStreakPopup] = useState(false)
    const [streakMilestone, setStreakMilestone] = useState(0)
    const lastStreakMilestoneRef = useRef(0)
    const [showGameOver, setShowGameOver] = useState(false)
    const isSwitchingModeRef = useRef(false)
    const [difficulty, setDifficulty] = useState<InfiniteDifficulty>('normal')
    const {
        maxGuesses,
        hints: hintCount,
        skips: skipCount,
    } = getDifficultyConfig(difficulty)
    const [skipsRemaining, setSkipsRemaining] = useState(skipCount)
    const [hintsRemaining, setHintsRemaining] = useState(hintCount)
    const [hintUsedOnIdol, setHintUsedOnIdol] = useState<string | null>(null)
    const hasTrackedCurrentGame = useRef(false)
    const [groupFilter, setGroupFilter] = useState<
        'boy-group' | 'girl-group' | 'both'
    >('both')
    const [genFilter, setGenFilter] = useState<number[]>(
        DEFAULT_INFINITE_GEN_FILTER
    )
    const [disabledLetters, setDisabledLetters] = useState<Set<string>>(
        new Set()
    )
    const [notInList, setNotInList] = useState(false)

    const {
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
    } = useGameProgress(dailyImage, correctAnswer, gameMode)

    const unlimitedStats = useUnlimitedStats(difficulty)

    const [timer, setTimer] = useState('00:00:00')
    const serverOffsetRef = useRef<number>(0)
    const tickIntervalRef = useRef<number | null>(null)
    const flipTimeoutRef = useRef<number | null>(null)
    const flipNowRef = useRef<(() => Promise<void>) | null>(null)
    const scheduleCountdownAndFlipRef = useRef<
        ((endAtISO: string) => void) | null
    >(null)
    const loadCurrentRef = useRef<(() => Promise<void>) | null>(null)
    const loadUnlimitedRefFunc = useRef<
        | ((
              filterOverride?: 'boy-group' | 'girl-group' | 'both',
              genFilterOverride?: number[],
              difficultyOverride?: InfiniteDifficulty
          ) => Promise<void>)
        | null
    >(null)

    const remainingGuesses = guesses.filter((g) => g === 'empty').length

    function formatMs(ms: number) {
        const clamped = Math.max(0, ms)
        const s = Math.floor(clamped / 1000)
        const hh = String(Math.floor(s / 3600)).padStart(2, '0')
        const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
        const ss = String(s % 60).padStart(2, '0')
        return `${hh}:${mm}:${ss}`
    }

    const clearTimers = useCallback(() => {
        if (tickIntervalRef.current) {
            clearInterval(tickIntervalRef.current)
            tickIntervalRef.current = null
        }
        if (flipTimeoutRef.current) {
            clearTimeout(flipTimeoutRef.current)
            flipTimeoutRef.current = null
        }
    }, [])

    const scheduleCountdownAndFlip = useCallback(
        (endAtISO: string) => {
            clearTimers()
            const endAtMs = new Date(endAtISO).getTime()

            tickIntervalRef.current = window.setInterval(() => {
                const approxServerNow = Date.now() + serverOffsetRef.current
                const remaining = endAtMs - approxServerNow
                setTimer(formatMs(remaining))
                if (remaining <= 0 && flipNowRef.current) {
                    void flipNowRef.current()
                }
            }, 1000)

            const delayMs = Math.max(
                0,
                endAtMs - (Date.now() + serverOffsetRef.current)
            )
            flipTimeoutRef.current = window.setTimeout(() => {
                if (flipNowRef.current) {
                    void flipNowRef.current()
                }
            }, delayMs)
        },
        [clearTimers]
    )

    scheduleCountdownAndFlipRef.current = scheduleCountdownAndFlip

    const flipNow = useCallback(async () => {
        clearTimers()

        setCurrentGuess('')
        setLastIncorrectGuess('')
        setGuesses(['empty', 'empty', 'empty', 'empty', 'empty', 'empty'])
        setIsAnimating(false)
        setShowConfetti(false)
        setGameWon(false)
        setDisabledLetters(new Set())
        resetGuessTimer()

        const next = await fetchCurrentDaily()
        if (!next) return

        setDailyImage(next)

        if (next.endAt && scheduleCountdownAndFlipRef.current) {
            scheduleCountdownAndFlipRef.current(next.endAt)
        }
    }, [clearTimers, setGuesses, setGameWon])

    flipNowRef.current = flipNow

    const loadCurrent = useCallback(async () => {
        setIsLoading(true)
        const row = await fetchCurrentDaily()
        setIsLoading(false)

        if (!row) return

        setDailyImage(row)

        const serverNowMs = new Date(row.serverNow || '').getTime()
        serverOffsetRef.current = serverNowMs - Date.now()

        if (row.endAt && scheduleCountdownAndFlipRef.current) {
            scheduleCountdownAndFlipRef.current(row.endAt)
        }
    }, [])

    loadCurrentRef.current = loadCurrent

    const restoredDailyRef = useRef<number | null>(null)
    useEffect(() => {
        if (gameMode !== 'daily') return
        if (!todayCompleted || !todayCompletionData || !dailyImage?.session) return
        if (todayCompletionData.imageId !== dailyImage.id) return
        if (restoredDailyRef.current === dailyImage.id) return
        const stored = todayCompletionData.correctAnswer?.trim()
        if (!stored) return
        restoredDailyRef.current = dailyImage.id
        setCorrectAnswer(stored.toUpperCase())
        const session = dailyImage.session
        const imageId = dailyImage.id
        void (async () => {
            const result = await submitIdolGuess(session, stored)
            if (!result?.idol || result.idol.id !== imageId) return
            setDailyImage((prev) =>
                prev && prev.id === imageId
                    ? { ...result.idol, group_name: prev.group_name }
                    : prev
            )
            if (result.idol.name) setCorrectAnswer(result.idol.name.toUpperCase())
        })()
    }, [gameMode, todayCompleted, todayCompletionData, dailyImage])

    const loadUnlimitedRef = useRef(false)

    const loadUnlimited = useCallback(
        async (
            filterOverride?: 'boy-group' | 'girl-group' | 'both',
            genFilterOverride?: number[],
            difficultyOverride?: InfiniteDifficulty
        ) => {
            if (loadUnlimitedRef.current) return
            loadUnlimitedRef.current = true

            const filterForApi =
                filterOverride !== undefined ? filterOverride : groupFilter
            const currentFilter = filterForApi === 'both' ? null : filterForApi
            const currentGenFilter =
                genFilterOverride !== undefined ? genFilterOverride : genFilter
            const activeDifficulty = difficultyOverride ?? difficulty
            const activeConfig = getDifficultyConfig(activeDifficulty)
            const currentStreak = unlimitedStats.stats.currentStreak
            const milestones = [1, 10, 25, 50, 75, 100]
            const lastMilestone =
                milestones.filter((m) => m <= currentStreak).pop() || 0
            lastStreakMilestoneRef.current = lastMilestone

            const savedGameState =
                unlimitedStats.loadGameState(activeDifficulty)
            const savedDifficulty = savedGameState?.difficulty ?? 'normal'
            const savedMatchesDifficulty =
                !!savedGameState && savedDifficulty === activeDifficulty

            if (savedGameState && !savedMatchesDifficulty) {
                unlimitedStats.clearGameState(activeDifficulty)
            }

            const remember = (images: PlayIdol[]) => {
                images.forEach((img) => addSeenIdolId(img.id))
            }

            if (savedGameState && savedMatchesDifficulty) {
                const savedIdol = savedGameState.idol?.session
                    ? fromStoredIdol(savedGameState.idol)
                    : null
                const filterMismatch =
                    currentFilter !== null &&
                    savedIdol?.group_category &&
                    savedIdol.group_category !== currentFilter

                if (!savedIdol || filterMismatch) {
                    unlimitedStats.clearGameState(activeDifficulty)
                    const newImages = await fetchUnlimitedIdols(
                        5,
                        currentFilter,
                        currentGenFilter,
                        activeConfig.maxGuesses
                    )
                    setIsLoading(false)
                    if (newImages.length > 0) {
                        setPrefetchedImages(newImages)
                        setCurrentImageIndex(1)
                        guessesLoadedRef.current = true
                        setDailyImage(newImages[0])
                        setSkipsRemaining(activeConfig.skips)
                        setHintsRemaining(activeConfig.hints)
                        setHintUsedOnIdol(null)
                        setCorrectAnswer('')
                        remember(newImages)
                    }
                    loadUnlimitedRef.current = false
                    return
                }

                const savedGuesses: Array<'correct' | 'incorrect' | 'empty'> =
                    Array.isArray(savedGameState.guesses) &&
                    savedGameState.guesses.length === activeConfig.maxGuesses
                        ? (savedGameState.guesses as Array<
                              'correct' | 'incorrect' | 'empty'
                          >)
                        : emptyGuesses(activeConfig.maxGuesses)

                const hasWon =
                    savedGameState.guesses?.includes('correct') || false
                const hasLost =
                    savedGameState.guesses?.filter((g) => g === 'incorrect')
                        .length === activeConfig.maxGuesses || false

                guessesLoadedRef.current = true
                justLoadedGuessesRef.current = true
                guessesRef.current = savedGuesses
                currentImageBucketRef.current = savedIdol.img_bucket

                setGameWon(hasWon)
                setGameLost(hasLost)
                setGuesses(savedGuesses)

                Promise.resolve().then(() => {
                    setDailyImage(savedIdol)
                    setCorrectAnswer('')
                    setHintsRemaining(
                        restoredHints(savedGameState, activeConfig.hints)
                    )
                    setHintUsedOnIdol(savedGameState.hintUsedOnIdol || null)
                    setSkipsRemaining(
                        savedGameState.skipsRemaining ?? activeConfig.skips
                    )
                })

                setTimeout(() => {
                    justLoadedGuessesRef.current = false
                }, 500)

                setCurrentGuess('')
                setLastIncorrectGuess('')
                setIsAnimating(false)
                setShowConfetti(false)
                setShowWinModal(false)
                setIsLoading(false)

                const storedPrefetch = (savedGameState.prefetchedImages || [])
                    .filter((img) => img.session)
                    .map((img) => fromStoredIdol(img))
                const filteredPrefetched =
                    currentFilter !== null
                        ? storedPrefetch.filter(
                              (img) => img.group_category === currentFilter
                          )
                        : storedPrefetch

                if (filteredPrefetched.length > 0) {
                    setPrefetchedImages(filteredPrefetched)
                    setCurrentImageIndex(savedGameState.currentImageIndex || 0)
                } else {
                    fetchUnlimitedIdols(
                        5,
                        currentFilter,
                        currentGenFilter,
                        activeConfig.maxGuesses
                    ).then((newImages) => {
                        setPrefetchedImages(newImages)
                        setCurrentImageIndex(0)
                        remember(newImages)
                    })
                }
            } else {
                setIsLoading(true)
                const newImages = await fetchUnlimitedIdols(
                    5,
                    currentFilter,
                    currentGenFilter,
                    activeConfig.maxGuesses
                )
                setIsLoading(false)

                if (newImages.length > 0) {
                    setPrefetchedImages(newImages)
                    setCurrentImageIndex(1)
                    guessesLoadedRef.current = true
                    setDailyImage(newImages[0])
                    setSkipsRemaining(activeConfig.skips)
                    setHintsRemaining(activeConfig.hints)
                    setHintUsedOnIdol(null)
                    setCorrectAnswer('')
                    remember(newImages)
                }
            }

            loadUnlimitedRef.current = false
        },
        [
            unlimitedStats,
            setGuesses,
            setGameWon,
            setGameLost,
            setCurrentGuess,
            setLastIncorrectGuess,
            setIsAnimating,
            setShowConfetti,
            setShowWinModal,
            groupFilter,
            genFilter,
            difficulty,
        ]
    )

    loadUnlimitedRefFunc.current = loadUnlimited

    const handleGameModeChange = useCallback(
        (
            mode: 'daily' | 'unlimited',
            filter?: 'boy-group' | 'girl-group' | 'both',
            genFilterParam?: number[],
            difficultyParam?: InfiniteDifficulty
        ) => {
            const nextDifficulty = difficultyParam ?? difficulty
            const difficultyChanged =
                mode === 'unlimited' && nextDifficulty !== difficulty
            const shouldLoadAnyway =
                pathname === '/infinite' && mode === 'unlimited' && !dailyImage
            if (mode === gameMode && !shouldLoadAnyway && !difficultyChanged)
                return
            if (isSwitchingModeRef.current) return
            isSwitchingModeRef.current = true

            if (
                gameMode === 'unlimited' &&
                dailyImage &&
                !gameWon &&
                !gameLost
            ) {
                unlimitedStats.saveGameState({
                    idol: toStoredIdol(dailyImage),
                    difficulty,
                    hintsRemaining,
                    hintUsedOnIdol: hintUsedOnIdol || undefined,
                    skipsRemaining,
                    guesses,
                    savedAt: new Date().toISOString(),
                    prefetchedImages: prefetchedImages.map((img) =>
                        toStoredIdol(img)
                    ),
                    currentImageIndex,
                })
            }

            localStorage.setItem('idol-guessr-game-mode', mode)

            if (filter !== undefined) {
                setGroupFilter(filter)
                localStorage.setItem('idol-guessr-group-filter', filter)
            }

            if (genFilterParam !== undefined) {
                setGenFilter(genFilterParam)
                localStorage.setItem(
                    'idol-guessr-gen-filter',
                    JSON.stringify(genFilterParam)
                )
            }

            if (difficultyParam !== undefined) {
                setDifficulty(difficultyParam)
                saveDifficulty(difficultyParam)
            }

            const nextConfig = getDifficultyConfig(nextDifficulty)

            setDailyImage(null)
            setIsLoading(true)

            setTimeout(() => {
                setGameMode(mode)
            }, 0)

            if (mode === 'daily') {
                setCurrentGuess('')
                setLastIncorrectGuess('')
                setGuesses([
                    'empty',
                    'empty',
                    'empty',
                    'empty',
                    'empty',
                    'empty',
                ])
                setIsAnimating(false)
                setShowConfetti(false)
                setGameWon(false)
                setGameLost(false)
                setShowWinModal(false)
                setShowGameOver(false)
                setDisabledLetters(new Set())
                if (loadCurrentRef.current) {
                    void loadCurrentRef.current()
                }
            } else {
                clearTimers()
                setPrefetchedImages([])
                setCurrentImageIndex(0)
                loadUnlimitedRef.current = false
                lastStreakMilestoneRef.current = 0
                setCurrentGuess('')
                setLastIncorrectGuess('')
                setGuesses(emptyGuesses(nextConfig.maxGuesses))
                setIsAnimating(false)
                setShowConfetti(false)
                setGameWon(false)
                setGameLost(false)
                setShowWinModal(false)
                setShowGameOver(false)
                setDisabledLetters(new Set())
                setHintsRemaining(nextConfig.hints)
                setSkipsRemaining(nextConfig.skips)
                setHintUsedOnIdol(null)
                if (loadUnlimitedRefFunc.current) {
                    void loadUnlimitedRefFunc.current(
                        filter,
                        genFilterParam,
                        nextDifficulty
                    )
                }
            }
        },
        [
            gameMode,
            clearTimers,
            setGuesses,
            setGameWon,
            setGameLost,
            dailyImage,
            guesses,
            gameWon,
            gameLost,
            unlimitedStats,
            prefetchedImages,
            currentImageIndex,
            hintsRemaining,
            hintUsedOnIdol,
            skipsRemaining,
            pathname,
            difficulty,
        ]
    )

    const loadNextUnlimited = useCallback(
        (
            overrideSkipsRemaining?: number,
            overrideHintsRemaining?: number,
            overrideGroupFilter?: 'boy-group' | 'girl-group' | 'both',
            overrideGenFilter?: number[],
            overrideDifficulty?: InfiniteDifficulty
        ) => {
            const effectiveFilter = overrideGroupFilter ?? groupFilter
            const effectiveGenFilter = overrideGenFilter ?? genFilter
            const activeDifficulty = overrideDifficulty ?? difficulty
            const activeConfig = getDifficultyConfig(activeDifficulty)
            if (!gameWon && !gameLost) {
                const hasGuesses = guesses.some(
                    (g) => g === 'incorrect' || g === 'correct'
                )
                if (hasGuesses) {
                    const currentStreak = unlimitedStats.stats.currentStreak
                    if (currentStreak >= 1 && !hasTrackedCurrentGame.current) {
                        void trackUnlimitedGame(currentStreak, activeDifficulty)
                        hasTrackedCurrentGame.current = true
                    }
                    unlimitedStats.updateStats(false, true, true)
                }
                lastStreakMilestoneRef.current = 0
            }

            hasTrackedCurrentGame.current = false

            setCurrentGuess('')
            setLastIncorrectGuess('')
            const freshGuesses = emptyGuesses(activeConfig.maxGuesses)
            setGuesses(freshGuesses)
            setIsAnimating(false)
            setShowConfetti(false)
            setGameWon(false)
            setGameLost(false)
            setShowWinModal(false)
            resetGuessTimer()

            const finalSkipsRemaining = overrideSkipsRemaining ?? skipsRemaining
            const finalHintsRemaining = overrideHintsRemaining ?? hintsRemaining

            if (overrideSkipsRemaining !== undefined)
                setSkipsRemaining(overrideSkipsRemaining)
            if (overrideHintsRemaining !== undefined)
                setHintsRemaining(overrideHintsRemaining)
            setHintUsedOnIdol(null)

            const buildGameState = (
                row: PlayIdol,
                nextImageIndex: number,
                images: PlayIdol[]
            ) => ({
                idol: toStoredIdol(row),
                difficulty: activeDifficulty,
                hintsRemaining: finalHintsRemaining,
                skipsRemaining: finalSkipsRemaining,
                guesses: freshGuesses,
                savedAt: new Date().toISOString(),
                prefetchedImages: images.map((img) => toStoredIdol(img)),
                currentImageIndex: nextImageIndex,
            })

            if (
                prefetchedImages.length > currentImageIndex &&
                !overrideGroupFilter
            ) {
                const row = prefetchedImages[currentImageIndex]
                const nextImageIndex = currentImageIndex + 1
                guessesLoadedRef.current = true
                justLoadedGuessesRef.current = true
                setDailyImage(row)
                setCorrectAnswer('')
                setCurrentImageIndex(nextImageIndex)
                setTimeout(() => {
                    justLoadedGuessesRef.current = false
                }, 300)

                unlimitedStats.saveGameState(
                    buildGameState(row, nextImageIndex, prefetchedImages),
                    activeDifficulty
                )

                if (prefetchedImages.length > nextImageIndex) {
                    const nextRow = prefetchedImages[nextImageIndex]
                    if (nextRow?.imageUrl) {
                        const img = new window.Image()
                        img.src = nextRow.imageUrl
                    }
                }

                if (nextImageIndex >= prefetchedImages.length - 2) {
                    const apiFilter =
                        effectiveFilter === 'both' ? null : effectiveFilter
                    fetchUnlimitedIdols(
                        5,
                        apiFilter,
                        effectiveGenFilter,
                        activeConfig.maxGuesses
                    ).then((newImages) => {
                        setPrefetchedImages((prev) => [...prev, ...newImages])
                        newImages.forEach((img) => addSeenIdolId(img.id))
                    })
                }
            } else {
                const apiFilter =
                    effectiveFilter === 'both' ? null : effectiveFilter
                fetchUnlimitedIdols(
                    5,
                    apiFilter,
                    effectiveGenFilter,
                    activeConfig.maxGuesses
                ).then((newImages) => {
                    if (newImages.length > 0) {
                        const basePrefetched = overrideGroupFilter
                            ? []
                            : prefetchedImages
                        const updatedPrefetched = [
                            ...basePrefetched,
                            ...newImages,
                        ]
                        setPrefetchedImages(updatedPrefetched)
                        const row = newImages[0]
                        const nextImageIndex = basePrefetched.length
                        guessesLoadedRef.current = true
                        justLoadedGuessesRef.current = true
                        setDailyImage(row)
                        setCorrectAnswer('')
                        setCurrentImageIndex(nextImageIndex + 1)
                        setTimeout(() => {
                            justLoadedGuessesRef.current = false
                        }, 300)

                        unlimitedStats.saveGameState(
                            buildGameState(
                                row,
                                nextImageIndex + 1,
                                updatedPrefetched
                            ),
                            activeDifficulty
                        )

                        newImages.forEach((img) => addSeenIdolId(img.id))
                    }
                })
            }
        },
        [
            prefetchedImages,
            currentImageIndex,
            setGuesses,
            setGameWon,
            setGameLost,
            unlimitedStats,
            gameWon,
            gameLost,
            guesses,
            hintsRemaining,
            skipsRemaining,
            groupFilter,
            genFilter,
            difficulty,
        ]
    )

    const handlePlayAgain = useCallback(
        (
            overrideGroupFilter?: 'boy-group' | 'girl-group' | 'both',
            overrideGenFilter?: number[],
            overrideDifficulty?: InfiniteDifficulty
        ) => {
            setShowGameOver(false)
            const nextDifficulty = overrideDifficulty ?? difficulty
            const nextConfig = getDifficultyConfig(nextDifficulty)
            unlimitedStats.clearGameState(difficulty)
            if (nextDifficulty !== difficulty) {
                unlimitedStats.clearGameState(nextDifficulty)
                setDifficulty(nextDifficulty)
                saveDifficulty(nextDifficulty)
            }
            clearSeenIdolIds()

            if (overrideGroupFilter) {
                setGroupFilter(overrideGroupFilter)
                localStorage.setItem(
                    'idol-guessr-group-filter',
                    overrideGroupFilter
                )
            }

            if (overrideGenFilter) {
                setGenFilter(overrideGenFilter)
                localStorage.setItem(
                    'idol-guessr-gen-filter',
                    JSON.stringify(overrideGenFilter)
                )
            }

            setHintsRemaining(nextConfig.hints)
            setSkipsRemaining(nextConfig.skips)
            setHintUsedOnIdol(null)
            setPrefetchedImages([])
            setCurrentImageIndex(0)
            loadNextUnlimited(
                nextConfig.skips,
                nextConfig.hints,
                overrideGroupFilter,
                overrideGenFilter,
                nextDifficulty
            )
        },
        [loadNextUnlimited, unlimitedStats, difficulty]
    )

    const handleSkip = useCallback(() => {
        if (skipsRemaining > 0) {
            const newSkipsRemaining = skipsRemaining - 1
            setSkipsRemaining(newSkipsRemaining)
            loadNextUnlimited(newSkipsRemaining)
        }
    }, [skipsRemaining, loadNextUnlimited])

    const handleKeyPress = useCallback(
        (key: string) => {
            if (gameMode === 'daily' && todayCompleted) return

            if (key === 'ENTER') {
                if (
                    currentGuess.trim() &&
                    guesses.some((g) => g === 'empty') &&
                    !isAnimating &&
                    !gameWon &&
                    !gameLost
                ) {
                    const normalizedGuess = currentGuess.toUpperCase().trim()

                    if (!idolNamesSet.has(normalizedGuess)) {
                        setNotInList(true)
                        setIsAnimating(true)
                        setTimeout(() => {
                            setIsAnimating(false)
                            setTimeout(() => setNotInList(false), 1000)
                        }, 500)
                        return
                    }

                    if (!dailyImage?.session) return
                    const guessLimit = gameMode === 'unlimited' ? maxGuesses : 6
                    const guessNumber = guessLimit - remainingGuesses + 1
                    setIsAnimating(true)

                    void (async () => {
                        if (gameMode === 'daily') {
                            saveGuessAttempt(normalizedGuess)
                        }
                        const result = await submitIdolGuess(
                            dailyImage.session,
                            normalizedGuess
                        )
                        if (!result) {
                            setIsAnimating(false)
                            return
                        }
                        const revealed = result.idol.name?.toUpperCase() || ''
                        setDailyImage((prev) =>
                            prev
                                ? {
                                      ...result.idol,
                                      group_name: prev.group_name,
                                  }
                                : result.idol
                        )
                        if (revealed) setCorrectAnswer(revealed)
                        if (result.idol.nextImageUrl) {
                            const preload = new window.Image()
                            preload.src = result.idol.nextImageUrl
                        }

                        if (!result.correct) {
                            setLastIncorrectGuess(normalizedGuess)
                            setCurrentGuess('')
                            if (result.absentLetters.length > 0) {
                                setDisabledLetters((prev) => {
                                    const next = new Set(prev)
                                    result.absentLetters.forEach((letter: string) =>
                                        next.add(letter)
                                    )
                                    return next
                                })
                            }
                            setTimeout(() => {
                                setIsAnimating(false)
                                const emptyIndex = guesses.findIndex(
                                    (g) => g === 'empty'
                                )
                                if (emptyIndex === -1) return
                                const newGuesses = [...guesses]
                                newGuesses[emptyIndex] = 'incorrect'
                                setGuesses(newGuesses)
                                const remainingAfterThis = newGuesses.filter(
                                    (g) => g === 'empty'
                                ).length
                                if (remainingAfterThis === 0 || result.gameOver) {
                                    setTimeout(() => {
                                        setGameLost(true)
                                        if (gameMode === 'daily') {
                                            handleGameLoss(revealed)
                                            if (dailyImage?.id) {
                                                const allGuesses =
                                                    loadGuessAttempts()
                                                void trackDailyGameEnd(
                                                    dailyImage.id,
                                                    allGuesses,
                                                    false
                                                )
                                            }
                                            setTimeout(() => {
                                                setShowWinModal(true)
                                            }, 2000)
                                        } else {
                                            const currentStreak =
                                                unlimitedStats.stats.currentStreak
                                            if (
                                                currentStreak >= 1 &&
                                                !hasTrackedCurrentGame.current
                                            ) {
                                                void trackUnlimitedGame(
                                                    currentStreak,
                                                    difficulty
                                                )
                                                hasTrackedCurrentGame.current = true
                                            }
                                            unlimitedStats.updateStats(false, true)
                                            unlimitedStats.clearGameState()
                                            lastStreakMilestoneRef.current = 0
                                            clearSeenIdolIds()
                                        }
                                    }, 300)
                                } else if (gameMode === 'daily') {
                                    saveProgress(newGuesses)
                                }
                            }, 500)
                        } else {
                            const emptyIndex = guesses.findIndex(
                                (g) => g === 'empty'
                            )
                            setGameWon(true)
                            if (gameMode === 'daily') setShowConfetti(true)
                            setIsAnimating(false)
                            setCurrentGuess('')
                            setGuesses((prev) => {
                                const newGuesses = [...prev]
                                if (emptyIndex === -1) return prev
                                newGuesses[emptyIndex] = 'correct'
                                return newGuesses
                            })
                            if (gameMode === 'daily') {
                                handleGameWin(guessNumber, revealed)
                                if (dailyImage?.id) {
                                    const allGuesses = loadGuessAttempts()
                                    void trackDailyGameEnd(
                                        dailyImage.id,
                                        allGuesses,
                                        true
                                    )
                                }
                                setTimeout(() => setShowWinModal(true), 2000)
                            } else {
                                const currentStreak =
                                    unlimitedStats.stats.currentStreak
                                const newStreak = currentStreak + 1
                                if (newStreak % 5 === 0) {
                                    setStreakMilestone(newStreak)
                                    setShowStreakPopup(true)
                                }
                                unlimitedStats.updateStats(true, false)
                                unlimitedStats.clearGameState()
                            }
                        }
                    })()
                }
            } else if (key === '✕') {
                if (!gameWon && !gameLost) {
                    if (currentGuess === '' && lastIncorrectGuess) {
                        setCurrentGuess(lastIncorrectGuess.slice(0, -1))
                        setLastIncorrectGuess('')
                    } else {
                        setCurrentGuess((prev) => prev.slice(0, -1))
                    }
                }
            } else {
                if (
                    guesses.some((g) => g === 'empty') &&
                    !isAnimating &&
                    !gameWon &&
                    !gameLost &&
                    currentGuess.length < 20
                ) {
                    if (lastIncorrectGuess) setLastIncorrectGuess('')
                    setCurrentGuess((prev) => prev + key)
                }
            }
        },
        [
            currentGuess,
            guesses,
            isAnimating,
            gameWon,
            gameLost,
            remainingGuesses,
            todayCompleted,
            handleGameWin,
            handleGameLoss,
            saveProgress,
            setGameLost,
            setGameWon,
            setGuesses,
            dailyImage,
            saveGuessAttempt,
            loadGuessAttempts,
            lastIncorrectGuess,
            gameMode,
            unlimitedStats,
            difficulty,
            maxGuesses,
        ]
    )

    useEffect(() => {
        const handlePhysicalKeyPress = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.isContentEditable
            ) {
                return
            }
            const key = event.key.toUpperCase()
            if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
                event.preventDefault()
            }
            if (key === 'ENTER') {
                handleKeyPress('ENTER')
            } else if (key === 'BACKSPACE') {
                handleKeyPress('✕')
            } else if (/^[A-Z]$/.test(key)) {
                if (!disabledLetters.has(key)) {
                    handleKeyPress(key)
                }
            }
        }
        window.addEventListener('keydown', handlePhysicalKeyPress)
        return () =>
            window.removeEventListener('keydown', handlePhysicalKeyPress)
    }, [handleKeyPress, disabledLetters])

    const hasLoadedInitialRef = useRef(false)

    useEffect(() => {
        // Helper to load gen filter from localStorage
        const loadGenFilter = () => {
            try {
                const savedGenFilter = localStorage.getItem(
                    'idol-guessr-gen-filter'
                )
                if (savedGenFilter) {
                    const parsed = JSON.parse(savedGenFilter)
                    if (isValidInfiniteGenFilter(parsed)) {
                        setGenFilter(parsed)
                    } else {
                        setGenFilter(DEFAULT_INFINITE_GEN_FILTER)
                    }
                } else {
                    setGenFilter(DEFAULT_INFINITE_GEN_FILTER)
                }
            } catch {
                setGenFilter(DEFAULT_INFINITE_GEN_FILTER)
            }
        }

        // If we're on the infinite page, don't set mode here - let the page handle it
        // This prevents the hook from loading daily mode before the page can switch to unlimited
        if (pathname === '/infinite') {
            const savedFilter = localStorage.getItem('idol-guessr-group-filter')
            if (
                savedFilter === 'boy-group' ||
                savedFilter === 'girl-group' ||
                savedFilter === 'both'
            ) {
                setGroupFilter(
                    savedFilter as 'boy-group' | 'girl-group' | 'both'
                )
            } else {
                setGroupFilter('both')
            }
            loadGenFilter()
            return
        }

        const savedMode = localStorage.getItem('idol-guessr-game-mode')
        if (savedMode === 'unlimited') {
            setGameMode('unlimited')
        } else {
            hasLoadedInitialRef.current = true
        }
        const savedFilter = localStorage.getItem('idol-guessr-group-filter')
        if (
            savedFilter === 'boy-group' ||
            savedFilter === 'girl-group' ||
            savedFilter === 'both'
        ) {
            setGroupFilter(savedFilter as 'boy-group' | 'girl-group' | 'both')
        } else {
            setGroupFilter('both')
        }
        loadGenFilter()
    }, [pathname])

    useEffect(() => {
        // Don't auto-load on infinite page - let the page handle it via handleGameModeChange
        if (pathname === '/infinite') return

        if (!hasLoadedInitialRef.current && gameMode === 'daily') return
        hasLoadedInitialRef.current = true
        let mounted = true
        const loadGame = async () => {
            if (!mounted) return
            setDailyImage(null)
            setIsLoading(true)
            if (gameMode === 'daily') {
                if (loadCurrentRef.current) {
                    await loadCurrentRef.current()
                }
            } else {
                if (loadUnlimitedRefFunc.current) {
                    await loadUnlimitedRefFunc.current()
                }
            }
            if (isSwitchingModeRef.current) {
                setTimeout(() => {
                    isSwitchingModeRef.current = false
                }, 100)
            }
        }
        void loadGame()

        resetGuessTimer()
        return () => {
            mounted = false
            clearTimers()
        }
    }, [gameMode, pathname, clearTimers])

    useEffect(() => {
        const update = () =>
            setWindowDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            })
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    useEffect(() => {
        try {
            const hasVisited = localStorage.getItem('idol-guessr-has-visited')
            if (!hasVisited) {
                setShowHelp(true)
                localStorage.setItem('idol-guessr-has-visited', 'true')
            }
        } catch (error) {
            console.error('Error checking first visit:', error)
        }
    }, [])

    useEffect(() => {
        const handleEmergencyRecovery = () => {
            if (gameMode === 'unlimited') {
                const savedGameState = unlimitedStats.loadGameState()
                const isValidSavedState = !!savedGameState?.idol?.session
                if (isValidSavedState && savedGameState?.idol) {
                    const savedImage = fromStoredIdol(savedGameState.idol)
                    if (
                        groupFilter !== 'both' &&
                        savedImage.group_category &&
                        savedImage.group_category !== groupFilter
                    ) {
                        unlimitedStats.clearGameState(difficulty)
                        setDailyImage(null)
                        setIsLoading(true)
                        guessesLoadedRef.current = false
                        justLoadedGuessesRef.current = false
                        setGuesses(emptyGuesses(maxGuesses))
                        setGameWon(false)
                        setGameLost(false)
                        setCurrentGuess('')
                        setLastIncorrectGuess('')
                        if (loadUnlimitedRefFunc.current) {
                            void loadUnlimitedRefFunc.current()
                        }
                        return
                    }
                    const savedGuesses: Array<
                        'correct' | 'incorrect' | 'empty'
                    > =
                        Array.isArray(savedGameState.guesses) &&
                        savedGameState.guesses.length === maxGuesses
                            ? (savedGameState.guesses as Array<
                                  'correct' | 'incorrect' | 'empty'
                              >)
                            : emptyGuesses(maxGuesses)

                    const hasWon =
                        savedGameState.guesses?.includes('correct') || false
                    const hasLost =
                        savedGameState.guesses?.filter((g) => g === 'incorrect')
                            .length === maxGuesses || false

                    guessesLoadedRef.current = true
                    justLoadedGuessesRef.current = true
                    guessesRef.current = savedGuesses
                    currentImageBucketRef.current = savedImage.img_bucket

                    setGameWon(hasWon)
                    setGameLost(hasLost)
                    setGuesses(savedGuesses)

                    Promise.resolve().then(() => {
                        setDailyImage(savedImage)
                        setCorrectAnswer('')
                    })

                    setTimeout(() => {
                        justLoadedGuessesRef.current = false
                    }, 500)
                    setIsLoading(false)
                } else {
                    console.error(
                        '[Emergency Recovery] Invalid or missing saved state, clearing and re-triggering unlimited flow'
                    )
                    unlimitedStats.clearGameState(difficulty)
                    setDailyImage(null)
                    setIsLoading(true)
                    guessesLoadedRef.current = false
                    justLoadedGuessesRef.current = false
                    setGuesses(emptyGuesses(maxGuesses))
                    setGameWon(false)
                    setGameLost(false)
                    setCurrentGuess('')
                    setLastIncorrectGuess('')
                    if (loadUnlimitedRefFunc.current) {
                        void loadUnlimitedRefFunc.current()
                    }
                }
            }
        }
        window.addEventListener(
            'idol-guessr-emergency-recovery',
            handleEmergencyRecovery
        )
        return () =>
            window.removeEventListener(
                'idol-guessr-emergency-recovery',
                handleEmergencyRecovery
            )
    }, [
        gameMode,
        unlimitedStats,
        setGuesses,
        setIsLoading,
        setGameWon,
        setGameLost,
        groupFilter,
        difficulty,
        maxGuesses,
    ])

    useEffect(() => {
        if (gameMode === 'unlimited' && (gameWon || gameLost)) {
            if (gameLost) {
                const timer = setTimeout(() => {
                    setShowGameOver(true)
                }, 2000)
                return () => clearTimeout(timer)
            } else {
                const delay = showStreakPopup ? 2400 : 2000
                const timer = setTimeout(() => {
                    loadNextUnlimited()
                }, delay)
                return () => clearTimeout(timer)
            }
        }
    }, [gameMode, gameWon, gameLost, loadNextUnlimited, showStreakPopup])

    const guessesLoadedRef = useRef(false)
    const justLoadedGuessesRef = useRef(false)
    const currentImageBucketRef = useRef<string | null>(null)

    useEffect(() => {
        if (!dailyImage) {
            guessesLoadedRef.current = false
            justLoadedGuessesRef.current = false
            currentImageBucketRef.current = null
        } else {
            currentImageBucketRef.current = dailyImage.img_bucket
        }
    }, [dailyImage])

    const guessesRef = useRef(guesses)
    useEffect(() => {
        guessesRef.current = guesses
    }, [guesses])

    useEffect(() => {
        if (
            gameMode === 'unlimited' &&
            dailyImage &&
            !gameWon &&
            !gameLost &&
            guesses.length === maxGuesses &&
            guessesLoadedRef.current &&
            currentImageBucketRef.current === dailyImage.img_bucket &&
            !justLoadedGuessesRef.current
        ) {
            const allEmpty = guesses.every((g) => g === 'empty')
            if (allEmpty) {
                return
            }
            unlimitedStats.saveGameState({
                idol: toStoredIdol(dailyImage),
                difficulty,
                hintsRemaining,
                hintUsedOnIdol: hintUsedOnIdol || undefined,
                skipsRemaining,
                guesses,
                savedAt: new Date().toISOString(),
                prefetchedImages: prefetchedImages.map((img) => toStoredIdol(img)),
                currentImageIndex,
            })
        }
    }, [
        gameMode,
        dailyImage,
        gameWon,
        gameLost,
        guesses,
        hintsRemaining,
        hintUsedOnIdol,
        skipsRemaining,
        difficulty,
        maxGuesses,
        prefetchedImages,
        currentImageIndex,
        unlimitedStats,
    ])

    return {
        // core
        gameMode,
        handleGameModeChange,
        timer,
        isLoading,
        dailyImage,
        remainingGuesses,
        gameWon,
        gameLost,
        guesses,
        // input/output state
        currentGuess,
        correctAnswer,
        lastIncorrectGuess,
        isAnimating,
        handleKeyPress,
        disabledLetters,
        notInList,
        // ui
        showConfetti,
        windowDimensions,
        showStats,
        setShowStats,
        showHelp,
        setShowHelp,
        showFeedback,
        setShowFeedback,
        showWinModal,
        setShowWinModal,
        // stats
        stats,
        statsLoaded,
        todayCompleted,
        todayCompletionData,
        loadGuessAttempts,
        // unlimited specific
        skipsRemaining,
        hintsRemaining,
        hintUsed: hintsRemaining < hintCount,
        maxGuesses,
        maxHints: hintCount,
        maxSkips: skipCount,
        difficulty,
        setHintUsed: (used: boolean) => {
            if (used) setHintsRemaining(0)
        },
        hintUsedOnIdol,
        setHintUsedOnIdol,
        consumeHint: () => {
            setHintsRemaining((current) =>
                current > 0 ? current - 1 : current
            )
        },
        revealHint: async () => {
            if (!dailyImage?.session || hintsRemaining <= 0) return
            const groupName = await fetchGroupHint(dailyImage.session)
            setHintsRemaining((current) => (current > 0 ? current - 1 : current))
            if (!groupName) return
            setDailyImage((prev) =>
                prev ? { ...prev, group_name: groupName } : prev
            )
            setHintUsedOnIdol(dailyImage.img_bucket)
        },
        showStreakPopup,
        streakMilestone,
        setShowStreakPopup,
        setStreakMilestone,
        showGameOver,
        handlePlayAgain,
        handleSkip,
        loadNextUnlimited,
        unlimitedCurrentStreak: unlimitedStats.stats.currentStreak,
        unlimitedMaxStreak: unlimitedStats.stats.maxStreak,
        unlimitedStatsData: unlimitedStats.stats,
        unlimitedStatsLoaded: unlimitedStats.isLoaded,
        groupFilter,
        genFilter,
    }
}
