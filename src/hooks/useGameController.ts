'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { usePathname } from 'next/navigation'
import {
    getDailyImage,
    getMultipleRandomUnlimitedImages,
    type DailyImage as DailyRow,
    getImageUrl,
    trackDailyGameEnd,
    trackUnlimitedGame,
    resetGuessTimer,
    addSeenIdol,
    clearSeenIdols,
} from '@/lib/supabase'
import { useGameProgress } from '@/hooks/useGameProgress'
import { useUnlimitedStats } from '@/components/stats/UserStats'
import { encodeIdolName, decodeIdolName } from '@/utils/encoding'
import idolNames from '@/data/idolNames.json'

const idolNamesSet = new Set(idolNames.map((name: string) => name.toUpperCase()))

export function useGameController() {
    const pathname = usePathname()
    const [gameMode, setGameMode] = useState<'daily' | 'unlimited'>('daily')
    const [currentGuess, setCurrentGuess] = useState('')
    const [lastIncorrectGuess, setLastIncorrectGuess] = useState('')
    const [dailyImage, setDailyImage] = useState<DailyRow | null>(null)
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
    const [prefetchedImages, setPrefetchedImages] = useState<DailyRow[]>([])
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showStreakPopup, setShowStreakPopup] = useState(false)
    const [streakMilestone, setStreakMilestone] = useState(0)
    const lastStreakMilestoneRef = useRef(0)
    const [showGameOver, setShowGameOver] = useState(false)
    const isSwitchingModeRef = useRef(false)
    const [skipsRemaining, setSkipsRemaining] = useState(3)
    const [hintUsed, setHintUsed] = useState(false)
    const [hintUsedOnIdol, setHintUsedOnIdol] = useState<string | null>(null)
    const hasTrackedCurrentGame = useRef(false)
    const [groupFilter, setGroupFilter] = useState<
        'boy-group' | 'girl-group' | 'both'
    >('both')
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

    const unlimitedStats = useUnlimitedStats()

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
            filterOverride?: 'boy-group' | 'girl-group' | 'both'
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

        const next = await getDailyImage()
        if (!next) return

        setDailyImage(next)
        if (next.name) setCorrectAnswer(next.name.toUpperCase())

        if (scheduleCountdownAndFlipRef.current) {
            scheduleCountdownAndFlipRef.current(next.end_at)
        }
    }, [clearTimers, setGuesses, setGameWon])

    flipNowRef.current = flipNow

    const loadCurrent = useCallback(async () => {
        setIsLoading(true)
        const row = await getDailyImage()
        setIsLoading(false)

        if (!row) return

        setDailyImage(row)
        if (row.name) setCorrectAnswer(row.name.toUpperCase())

        const serverNowMs = new Date(row.server_now).getTime()
        serverOffsetRef.current = serverNowMs - Date.now()

        if (scheduleCountdownAndFlipRef.current) {
            scheduleCountdownAndFlipRef.current(row.end_at)
        }
    }, [])

    loadCurrentRef.current = loadCurrent

    const loadUnlimitedRef = useRef(false)

    const loadUnlimited = useCallback(
        async (filterOverride?: 'boy-group' | 'girl-group' | 'both') => {
            if (loadUnlimitedRef.current) return
            loadUnlimitedRef.current = true

            const filterForApi = filterOverride !== undefined ? filterOverride : groupFilter
            const currentFilter = filterForApi === 'both' ? null : filterForApi
            const currentStreak = unlimitedStats.stats.currentStreak
            const milestones = [1, 10, 25, 50, 75, 100]
            const lastMilestone =
                milestones.filter((m) => m <= currentStreak).pop() || 0
            lastStreakMilestoneRef.current = lastMilestone

            const savedGameState = unlimitedStats.loadGameState()

            if (savedGameState) {
                const isValidSavedState =
                    savedGameState.encodedIdolName &&
                    savedGameState.groupCategory &&
                    savedGameState.base64Group

                if (!isValidSavedState) {
                    unlimitedStats.clearGameState()
                    const newImages = await getMultipleRandomUnlimitedImages(
                        5,
                        currentFilter
                    )
                    setIsLoading(false)

                    if (newImages.length > 0) {
                        setPrefetchedImages(newImages)
                        setCurrentImageIndex(1)
                        guessesLoadedRef.current = true
                        setDailyImage(newImages[0])
                        setSkipsRemaining(3)
                        setHintUsed(false)
                        setHintUsedOnIdol(null)
                        if (newImages[0].name)
                            setCorrectAnswer(newImages[0].name.toUpperCase())
                        if (newImages[0].img_bucket)
                            addSeenIdol(newImages[0].img_bucket)
                    }
                    loadUnlimitedRef.current = false
                    return
                }

                const decodedName = decodeIdolName(
                    savedGameState.encodedIdolName
                )
                const decodedAltName = savedGameState.encodedAltName
                    ? decodeIdolName(savedGameState.encodedAltName)
                    : undefined

                const savedImage: DailyRow = {
                    id: 0,
                    name: decodedName,
                    alt_name: decodedAltName,
                    group_type: savedGameState.groupType,
                    img_bucket: savedGameState.imgBucket,
                    group_category: savedGameState.groupCategory,
                    base64_group: savedGameState.base64Group,
                    base64_idol: savedGameState.base64Idol,
                    group_name: savedGameState.groupName,
                }

                if (
                    currentFilter !== null &&
                    savedImage.group_category !== currentFilter
                ) {
                    unlimitedStats.clearGameState()
                    const newImages = await getMultipleRandomUnlimitedImages(
                        5,
                        currentFilter
                    )
                    setIsLoading(false)

                    if (newImages.length > 0) {
                        setPrefetchedImages(newImages)
                        setCurrentImageIndex(1)
                        guessesLoadedRef.current = true
                        setDailyImage(newImages[0])
                        setSkipsRemaining(3)
                        setHintUsed(false)
                        setHintUsedOnIdol(null)
                        if (newImages[0].name)
                            setCorrectAnswer(newImages[0].name.toUpperCase())
                        if (newImages[0].img_bucket)
                            addSeenIdol(newImages[0].img_bucket)
                    }
                    loadUnlimitedRef.current = false
                    return
                }

                const savedGuesses: Array<'correct' | 'incorrect' | 'empty'> = Array.isArray(savedGameState.guesses) && savedGameState.guesses.length === 6
                    ? savedGameState.guesses as Array<'correct' | 'incorrect' | 'empty'>
                    : ['empty', 'empty', 'empty', 'empty', 'empty', 'empty']

                const hasWon = savedGameState.guesses?.includes('correct') || false
                const hasLost =
                    savedGameState.guesses?.filter((g) => g === 'incorrect')
                        .length === 6 || false

                guessesLoadedRef.current = true
                justLoadedGuessesRef.current = true
                guessesRef.current = savedGuesses
                currentImageBucketRef.current = savedImage.img_bucket

                setGameWon(hasWon)
                setGameLost(hasLost)
                setGuesses(savedGuesses)

                Promise.resolve().then(() => {
                    setDailyImage(savedImage)
                    setCorrectAnswer(decodedName.toUpperCase())
                    setHintUsed(savedGameState.hintUsed || false)
                    setHintUsedOnIdol(savedGameState.hintUsedOnIdol || null)
                    setSkipsRemaining(savedGameState.skipsRemaining ?? 3)
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

                if (
                    savedGameState.prefetchedImages &&
                    savedGameState.prefetchedImages.length > 0
                ) {
                    const allImagesValid =
                        savedGameState.prefetchedImages.every(
                            (img) => img.group_category && img.base64_group
                        )

                    if (allImagesValid) {
                        const filteredPrefetched = currentFilter !== null
                            ? savedGameState.prefetchedImages.filter(
                                (img) => img.group_category === currentFilter
                            )
                            : savedGameState.prefetchedImages

                        if (filteredPrefetched.length > 0) {
                            setPrefetchedImages(filteredPrefetched)
                            setCurrentImageIndex(
                                savedGameState.currentImageIndex || 0
                            )
                        } else {
                            getMultipleRandomUnlimitedImages(
                                5,
                                currentFilter
                            ).then((newImages) => {
                                setPrefetchedImages(newImages)
                                setCurrentImageIndex(0)
                                newImages.forEach((img) => {
                                    if (img.img_bucket)
                                        addSeenIdol(img.img_bucket)
                                })
                            })
                        }
                    } else {
                        getMultipleRandomUnlimitedImages(5, currentFilter).then(
                            (newImages) => {
                                setPrefetchedImages(newImages)
                                setCurrentImageIndex(0)
                                newImages.forEach((img) => {
                                    if (img.img_bucket)
                                        addSeenIdol(img.img_bucket)
                                })
                            }
                        )
                    }
                } else {
                    getMultipleRandomUnlimitedImages(5, currentFilter).then(
                        (newImages) => {
                            setPrefetchedImages(newImages)
                            setCurrentImageIndex(0)
                            newImages.forEach((img) => {
                                if (img.img_bucket) addSeenIdol(img.img_bucket)
                            })
                        }
                    )
                }
            } else {
                setIsLoading(true)
                const newImages = await getMultipleRandomUnlimitedImages(
                    5,
                    currentFilter
                )
                setIsLoading(false)

                if (newImages.length > 0) {
                    setPrefetchedImages(newImages)
                    setCurrentImageIndex(1)
                    guessesLoadedRef.current = true
                    setDailyImage(newImages[0])
                    setSkipsRemaining(3)
                    setHintUsed(false)
                    setHintUsedOnIdol(null)
                    if (newImages[0].name)
                        setCorrectAnswer(newImages[0].name.toUpperCase())
                    newImages.forEach((img) => {
                        if (img.img_bucket) addSeenIdol(img.img_bucket)
                    })
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
        ]
    )

    loadUnlimitedRefFunc.current = loadUnlimited

    const handleGameModeChange = useCallback(
        (
            mode: 'daily' | 'unlimited',
            filter?: 'boy-group' | 'girl-group' | 'both'
        ) => {
            const shouldLoadAnyway =
                pathname === '/infinite' && mode === 'unlimited' && !dailyImage
            if (mode === gameMode && !shouldLoadAnyway) return
            if (isSwitchingModeRef.current) return
            isSwitchingModeRef.current = true

            if (
                gameMode === 'unlimited' &&
                dailyImage &&
                !gameWon &&
                !gameLost
            ) {
                unlimitedStats.saveGameState({
                    groupType: dailyImage.group_type || '',
                    imgBucket: dailyImage.img_bucket,
                    groupCategory: dailyImage.group_category,
                    base64Group: dailyImage.base64_group,
                    base64Idol: dailyImage.base64_idol,
                    encodedIdolName: encodeIdolName(dailyImage.name || ''),
                    encodedAltName: dailyImage.alt_name
                        ? encodeIdolName(dailyImage.alt_name)
                        : undefined,
                    groupName: dailyImage.group_name,
                    hintUsed: hintUsed,
                    hintUsedOnIdol: hintUsedOnIdol || undefined,
                    skipsRemaining: skipsRemaining,
                    guesses: guesses,
                    savedAt: new Date().toISOString(),
                    prefetchedImages: prefetchedImages.map((img) => ({
                        id: img.id,
                        name: img.name,
                        alt_name: img.alt_name,
                        group_type: img.group_type || '',
                        img_bucket: img.img_bucket,
                        group_category: img.group_category,
                        base64_group: img.base64_group,
                        base64_idol: img.base64_idol,
                        group_name: img.group_name,
                    })),
                    currentImageIndex: currentImageIndex,
                })
            }

            localStorage.setItem('idol-guessr-game-mode', mode)

            if (filter !== undefined) {
                setGroupFilter(filter)
                localStorage.setItem('idol-guessr-group-filter', filter)
            }

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
                if (loadUnlimitedRefFunc.current) {
                    void loadUnlimitedRefFunc.current(filter)
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
            hintUsed,
            hintUsedOnIdol,
            skipsRemaining,
            pathname,
        ]
    )

    const loadNextUnlimited = useCallback(
        (
            overrideSkipsRemaining?: number,
            overrideHintUsed?: boolean,
            overrideHintUsedOnIdol?: string | null,
            overrideGroupFilter?: 'boy-group' | 'girl-group' | 'both'
        ) => {
            const effectiveFilter = overrideGroupFilter ?? groupFilter
            if (!gameWon && !gameLost) {
                const hasGuesses = guesses.some(
                    (g) => g === 'incorrect' || g === 'correct'
                )
                if (hasGuesses) {
                    const currentStreak = unlimitedStats.stats.currentStreak
                    if (currentStreak >= 1 && !hasTrackedCurrentGame.current) {
                        void trackUnlimitedGame(currentStreak)
                        hasTrackedCurrentGame.current = true
                    }
                    unlimitedStats.updateStats(false, true, true)
                }
                lastStreakMilestoneRef.current = 0
            }

            hasTrackedCurrentGame.current = false

            setCurrentGuess('')
            setLastIncorrectGuess('')
            const freshGuesses: Array<'correct' | 'incorrect' | 'empty'> = [
                'empty',
                'empty',
                'empty',
                'empty',
                'empty',
                'empty',
            ]
            setGuesses(freshGuesses)
            setIsAnimating(false)
            setShowConfetti(false)
            setGameWon(false)
            setGameLost(false)
            setShowWinModal(false)
            resetGuessTimer()

            const finalSkipsRemaining = overrideSkipsRemaining ?? skipsRemaining
            const finalHintUsed = overrideHintUsed ?? hintUsed
            const finalHintUsedOnIdol =
                overrideHintUsedOnIdol !== undefined
                    ? overrideHintUsedOnIdol
                    : hintUsedOnIdol

            if (overrideSkipsRemaining !== undefined)
                setSkipsRemaining(overrideSkipsRemaining)
            if (overrideHintUsed !== undefined) setHintUsed(overrideHintUsed)
            if (overrideHintUsedOnIdol !== undefined)
                setHintUsedOnIdol(overrideHintUsedOnIdol)

            const buildGameState = (
                row: DailyRow,
                nextImageIndex: number,
                images: DailyRow[]
            ) => ({
                groupType: row.group_type || '',
                imgBucket: row.img_bucket,
                groupCategory: row.group_category,
                base64Group: row.base64_group,
                base64Idol: row.base64_idol,
                encodedIdolName: encodeIdolName(row.name || ''),
                encodedAltName: row.alt_name
                    ? encodeIdolName(row.alt_name)
                    : undefined,
                groupName: row.group_name,
                hintUsed: finalHintUsed,
                hintUsedOnIdol: finalHintUsedOnIdol || undefined,
                skipsRemaining: finalSkipsRemaining,
                guesses: freshGuesses,
                savedAt: new Date().toISOString(),
                prefetchedImages: images.map((img) => ({
                    id: img.id,
                    name: img.name,
                    alt_name: img.alt_name,
                    group_type: img.group_type || '',
                    img_bucket: img.img_bucket,
                    group_category: img.group_category,
                    base64_group: img.base64_group,
                    base64_idol: img.base64_idol,
                    group_name: img.group_name,
                })),
                currentImageIndex: nextImageIndex,
            })

            if (prefetchedImages.length > currentImageIndex && !overrideGroupFilter) {
                const row = prefetchedImages[currentImageIndex]
                const nextImageIndex = currentImageIndex + 1
                guessesLoadedRef.current = true
                justLoadedGuessesRef.current = true
                setDailyImage(row)
                if (row.name) setCorrectAnswer(row.name.toUpperCase())
                setCurrentImageIndex(nextImageIndex)
                setTimeout(() => {
                    justLoadedGuessesRef.current = false
                }, 300)

                unlimitedStats.saveGameState(
                    buildGameState(row, nextImageIndex, prefetchedImages)
                )

                if (prefetchedImages.length > nextImageIndex) {
                    const nextRow = prefetchedImages[nextImageIndex]
                    if (
                        nextRow &&
                        nextRow.group_category &&
                        nextRow.base64_group
                    ) {
                        const imagesToPreload = [1, 2, 3, 4, 5, 'clear'].map(
                            (num) =>
                                getImageUrl(
                                    nextRow.group_type || '',
                                    nextRow.img_bucket,
                                    num as number | 'clear',
                                    'unlimited',
                                    nextRow.group_category,
                                    nextRow.base64_group
                                )
                        )
                        imagesToPreload.forEach((url) => {
                            const img = new window.Image()
                            img.src = url
                        })
                    }
                }

                if (nextImageIndex >= prefetchedImages.length - 2) {
                    const apiFilter = effectiveFilter === 'both' ? null : effectiveFilter
                    getMultipleRandomUnlimitedImages(5, apiFilter).then(
                        (newImages) => {
                            setPrefetchedImages((prev) => [
                                ...prev,
                                ...newImages,
                            ])
                            newImages.forEach((img) => {
                                if (img.img_bucket) addSeenIdol(img.img_bucket)
                            })
                        }
                    )
                }
            } else {
                const apiFilter = effectiveFilter === 'both' ? null : effectiveFilter
                getMultipleRandomUnlimitedImages(5, apiFilter).then(
                    (newImages) => {
                        if (newImages.length > 0) {
                            const basePrefetched = overrideGroupFilter ? [] : prefetchedImages
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
                            if (row.name)
                                setCorrectAnswer(row.name.toUpperCase())
                            setCurrentImageIndex(nextImageIndex + 1)
                            setTimeout(() => {
                                justLoadedGuessesRef.current = false
                            }, 300)

                            unlimitedStats.saveGameState(
                                buildGameState(
                                    row,
                                    nextImageIndex + 1,
                                    updatedPrefetched
                                )
                            )

                            newImages.forEach((img) => {
                                if (img.img_bucket) addSeenIdol(img.img_bucket)
                            })
                        }
                    }
                )
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
            hintUsed,
            hintUsedOnIdol,
            skipsRemaining,
            dailyImage,
            groupFilter,
        ]
    )

    const handlePlayAgain = useCallback((overrideGroupFilter?: 'boy-group' | 'girl-group' | 'both') => {
        setShowGameOver(false)
        unlimitedStats.clearGameState()
        clearSeenIdols()

        if (overrideGroupFilter) {
            setGroupFilter(overrideGroupFilter)
            localStorage.setItem('idol-guessr-group-filter', overrideGroupFilter)
        }

        setPrefetchedImages([])
        setCurrentImageIndex(0)
        loadNextUnlimited(3, false, null, overrideGroupFilter)
    }, [loadNextUnlimited, unlimitedStats])

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

                    const normalizedName =
                        dailyImage?.name?.toUpperCase().trim() || ''
                    const normalizedAltName =
                        dailyImage?.alt_name?.toUpperCase().trim() || ''
                    let isCorrect = normalizedGuess === normalizedName
                    let matchedAnswer = normalizedName
                    if (
                        gameMode === 'unlimited' &&
                        normalizedAltName &&
                        !isCorrect
                    ) {
                        isCorrect = normalizedGuess === normalizedAltName
                        if (isCorrect) matchedAnswer = normalizedAltName
                    }
                    const guessNumber = 6 - remainingGuesses + 1

                    if (gameMode === 'daily') {
                        saveGuessAttempt(normalizedGuess)
                    }

                    setIsAnimating(true)

                    if (!isCorrect) {
                        setLastIncorrectGuess(normalizedGuess)
                        setCurrentGuess('')

                        // Track letters that are NOT in the correct answer (only for daily mode)
                        if (gameMode === 'daily') {
                            const correctLetters = new Set(
                                normalizedName.split('')
                            )
                            const incorrectLettersInGuess = normalizedGuess
                                .split('')
                                .filter((letter) => !correctLetters.has(letter))

                            setDisabledLetters((prev) => {
                                const newDisabled = new Set(prev)
                                incorrectLettersInGuess.forEach((letter) =>
                                    newDisabled.add(letter)
                                )
                                return newDisabled
                            })
                        }

                        setTimeout(() => {
                            setIsAnimating(false)
                            setGuesses((prev) => {
                                const newGuesses = [...prev]
                                const emptyIndex = newGuesses.findIndex(
                                    (g) => g === 'empty'
                                )
                                if (emptyIndex === -1) return prev
                                newGuesses[emptyIndex] = 'incorrect'
                                const remainingAfterThis = newGuesses.filter(
                                    (g) => g === 'empty'
                                ).length
                                if (remainingAfterThis === 0) {
                                    setTimeout(() => {
                                        setGameLost(true)
                                        if (gameMode === 'daily') {
                                            handleGameLoss()
                                            if (dailyImage?.id) {
                                                const allGuesses = loadGuessAttempts()
                                                void trackDailyGameEnd(dailyImage.id, allGuesses, false)
                                            }
                                            setTimeout(() => {
                                                setShowWinModal(true)
                                            }, 2000)
                                        } else {
                                            const currentStreak =
                                                unlimitedStats.stats
                                                    .currentStreak
                                            if (
                                                currentStreak >= 1 &&
                                                !hasTrackedCurrentGame.current
                                            ) {
                                                void trackUnlimitedGame(currentStreak)
                                                hasTrackedCurrentGame.current = true
                                            }
                                            unlimitedStats.updateStats(
                                                false,
                                                true
                                            )
                                            unlimitedStats.clearGameState()
                                            lastStreakMilestoneRef.current = 0
                                            clearSeenIdols()
                                        }
                                    }, 300)
                                } else {
                                    if (gameMode === 'daily') {
                                        saveProgress(newGuesses)
                                    }
                                }
                                return newGuesses
                            })
                        }, 500)
                    } else {
                        const emptyIndex = guesses.findIndex(
                            (g) => g === 'empty'
                        )
                        setGameWon(true)
                        if (gameMode === 'unlimited')
                            setCorrectAnswer(matchedAnswer)
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
                            handleGameWin(guessNumber)
                            if (dailyImage?.id) {
                                const allGuesses = loadGuessAttempts()
                                void trackDailyGameEnd(dailyImage.id, allGuesses, true)
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

    const gameModeRef = useRef(gameMode)
    gameModeRef.current = gameMode
    const hasLoadedInitialRef = useRef(false)

    useEffect(() => {
        // If we're on the infinite page, don't set mode here - let the page handle it
        // This prevents the hook from loading daily mode before the page can switch to unlimited
        if (pathname === '/infinite') {
            const savedFilter = localStorage.getItem('idol-guessr-group-filter')
            if (savedFilter === 'boy-group' || savedFilter === 'girl-group' || savedFilter === 'both') {
                setGroupFilter(savedFilter as 'boy-group' | 'girl-group' | 'both')
            } else {
                setGroupFilter('both')
            }
            return
        }

        const savedMode = localStorage.getItem('idol-guessr-game-mode')
        if (savedMode === 'unlimited') {
            setGameMode('unlimited')
        } else {
            hasLoadedInitialRef.current = true
        }
        const savedFilter = localStorage.getItem('idol-guessr-group-filter')
        if (savedFilter === 'boy-group' || savedFilter === 'girl-group' || savedFilter === 'both') {
            setGroupFilter(savedFilter as 'boy-group' | 'girl-group' | 'both')
        } else {
            setGroupFilter('both')
        }
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

        const onFocus = () => {
            if (gameModeRef.current === 'daily' && loadCurrentRef.current) {
                void loadCurrentRef.current()
            }
        }
        if (gameMode === 'daily') {
            window.addEventListener('focus', onFocus)
            document.addEventListener('visibilitychange', onFocus)
        }
        resetGuessTimer()
        return () => {
            mounted = false
            clearTimers()
            window.removeEventListener('focus', onFocus)
            document.removeEventListener('visibilitychange', onFocus)
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
                const isValidSavedState =
                    savedGameState &&
                    savedGameState.encodedIdolName &&
                    savedGameState.groupCategory &&
                    savedGameState.base64Group
                if (isValidSavedState) {
                    const decodedName = decodeIdolName(
                        savedGameState.encodedIdolName
                    )
                    const decodedAltName = savedGameState.encodedAltName
                        ? decodeIdolName(savedGameState.encodedAltName)
                        : undefined
                    const savedImage: DailyRow = {
                        id: 0,
                        name: decodedName,
                        alt_name: decodedAltName,
                        group_type: savedGameState.groupType,
                        img_bucket: savedGameState.imgBucket,
                        group_category: savedGameState.groupCategory,
                        base64_group: savedGameState.base64Group,
                        base64_idol: savedGameState.base64Idol,
                    }
                    if (
                        groupFilter &&
                        savedImage.group_category !== groupFilter
                    ) {
                        unlimitedStats.clearGameState()
                        setDailyImage(null)
                        setIsLoading(true)
                        guessesLoadedRef.current = false
                        justLoadedGuessesRef.current = false
                        setGuesses([
                            'empty',
                            'empty',
                            'empty',
                            'empty',
                            'empty',
                            'empty',
                        ])
                        setGameWon(false)
                        setGameLost(false)
                        setCurrentGuess('')
                        setLastIncorrectGuess('')
                        if (loadUnlimitedRefFunc.current) {
                            void loadUnlimitedRefFunc.current()
                        }
                        return
                    }
                    const savedGuesses: Array<'correct' | 'incorrect' | 'empty'> = Array.isArray(savedGameState.guesses) && savedGameState.guesses.length === 6
                        ? savedGameState.guesses as Array<'correct' | 'incorrect' | 'empty'>
                        : ['empty', 'empty', 'empty', 'empty', 'empty', 'empty']

                    const hasWon = savedGameState.guesses?.includes('correct') || false
                    const hasLost =
                        savedGameState.guesses?.filter((g) => g === 'incorrect')
                            .length === 6 || false

                    guessesLoadedRef.current = true
                    justLoadedGuessesRef.current = true
                    guessesRef.current = savedGuesses
                    currentImageBucketRef.current = savedImage.img_bucket

                    setGameWon(hasWon)
                    setGameLost(hasLost)
                    setGuesses(savedGuesses)

                    Promise.resolve().then(() => {
                        setDailyImage(savedImage)
                        setCorrectAnswer(decodedName.toUpperCase())
                    })

                    setTimeout(() => {
                        justLoadedGuessesRef.current = false
                    }, 500)
                    setIsLoading(false)
                } else {
                    console.error(
                        '[Emergency Recovery] Invalid or missing saved state, clearing and re-triggering unlimited flow'
                    )
                    unlimitedStats.clearGameState()
                    setDailyImage(null)
                    setIsLoading(true)
                    guessesLoadedRef.current = false
                    justLoadedGuessesRef.current = false
                    setGuesses([
                        'empty',
                        'empty',
                        'empty',
                        'empty',
                        'empty',
                        'empty',
                    ])
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
            guesses.length === 6 &&
            guessesLoadedRef.current &&
            currentImageBucketRef.current === dailyImage.img_bucket &&
            !justLoadedGuessesRef.current
        ) {
            const allEmpty = guesses.every(g => g === 'empty')
            if (allEmpty) {
                return
            }
            unlimitedStats.saveGameState({
                groupType: dailyImage.group_type || '',
                imgBucket: dailyImage.img_bucket,
                groupCategory: dailyImage.group_category,
                base64Group: dailyImage.base64_group,
                base64Idol: dailyImage.base64_idol,
                encodedIdolName: encodeIdolName(dailyImage.name || ''),
                encodedAltName: dailyImage.alt_name
                    ? encodeIdolName(dailyImage.alt_name)
                    : undefined,
                groupName: dailyImage.group_name,
                hintUsed: hintUsed,
                hintUsedOnIdol: hintUsedOnIdol || undefined,
                skipsRemaining: skipsRemaining,
                guesses: guesses,
                savedAt: new Date().toISOString(),
                prefetchedImages: prefetchedImages.map((img) => ({
                    id: img.id,
                    name: img.name,
                    alt_name: img.alt_name,
                    group_type: img.group_type || '',
                    img_bucket: img.img_bucket,
                    group_category: img.group_category,
                    base64_group: img.base64_group,
                    base64_idol: img.base64_idol,
                    group_name: img.group_name,
                })),
                currentImageIndex: currentImageIndex,
            })
        }
    }, [
        gameMode,
        dailyImage,
        gameWon,
        gameLost,
        guesses,
        hintUsed,
        hintUsedOnIdol,
        skipsRemaining,
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
        hintUsed,
        setHintUsed,
        hintUsedOnIdol,
        setHintUsedOnIdol,
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
    }
}
