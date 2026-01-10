'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
    getMultipleRandomHangulImages,
    type HangulImage,
    getHangulImageUrl,
    resetGuessTimer,
    addSeenHangulIdol,
    clearSeenHangulIdols,
    trackHangulGame,
} from '@/lib/supabase'
import { useHangulStats } from '@/components/stats/UserStats'
import { encodeIdolName, decodeIdolName } from '@/utils/encoding'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'

export function useHangulGameController() {
    const [currentGuess, setCurrentGuess] = useState('')
    const [lastIncorrectGuess, setLastIncorrectGuess] = useState('')
    const [hangulImage, setHangulImage] = useState<HangulImage | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isAnimating, setIsAnimating] = useState(false)
    const [correctAnswer, setCorrectAnswer] = useState('')
    const [hangulName, setHangulName] = useState('')
    const [imageRevealed, setImageRevealed] = useState(false)
    const [showConfetti, setShowConfetti] = useState(false)
    const [showStats, setShowStats] = useState(false)
    const [showHelp, setShowHelp] = useState(false)
    const [showFeedback, setShowFeedback] = useState(false)
    const [showWinModal, setShowWinModal] = useState(false)
    const [windowDimensions, setWindowDimensions] = useState({
        width: 0,
        height: 0,
    })
    const [prefetchedImages, setPrefetchedImages] = useState<HangulImage[]>([])
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [showStreakPopup, setShowStreakPopup] = useState(false)
    const [streakMilestone, setStreakMilestone] = useState(0)
    const lastStreakMilestoneRef = useRef(0)
    const [showGameOver, setShowGameOver] = useState(false)
    const [skipsRemaining, setSkipsRemaining] = useState(3)
    const [guesses, setGuesses] = useState<Array<'correct' | 'incorrect' | 'empty'>>([
        'empty', 'empty', 'empty'
    ])
    const [gameWon, setGameWon] = useState(false)
    const [gameLost, setGameLost] = useState(false)
    const [groupFilter, setGroupFilter] = useState<GroupFilter>('both')
    const [finalStreak, setFinalStreak] = useState(0)

    const hangulStats = useHangulStats()

    const remainingGuesses = guesses.filter((g) => g === 'empty').length

    const guessesLoadedRef = useRef(false)
    const justLoadedGuessesRef = useRef(false)
    const currentImageBucketRef = useRef<string | null>(null)
    const guessesRef = useRef(guesses)
    const loadHangulRef = useRef(false)
    const loadHangulRefFunc = useRef<((filterOverride?: GroupFilter) => Promise<void>) | null>(null)
    const lossRecordedRef = useRef(false)
    const hasTrackedCurrentGame = useRef(false)

    useEffect(() => {
        guessesRef.current = guesses
    }, [guesses])

    useEffect(() => {
        if (!hangulImage) {
            guessesLoadedRef.current = false
            justLoadedGuessesRef.current = false
            currentImageBucketRef.current = null
        } else {
            currentImageBucketRef.current = hangulImage.img_bucket
        }
    }, [hangulImage])

    const loadHangul = useCallback(
        async (filterOverride?: GroupFilter) => {
            if (loadHangulRef.current) return
            loadHangulRef.current = true

            const filterForApi = filterOverride !== undefined ? filterOverride : groupFilter
            const currentFilter = filterForApi === 'both' ? null : filterForApi
            const currentStreak = hangulStats.stats.currentStreak
            const milestones = [1, 10, 25, 50, 75, 100]
            const lastMilestone = milestones.filter((m) => m <= currentStreak).pop() || 0
            lastStreakMilestoneRef.current = lastMilestone

            const savedGameState = hangulStats.loadGameState()

            if (savedGameState) {
                // Only require encodedIdolName and hangulName - image data is optional
                const isValidSavedState =
                    savedGameState.encodedIdolName &&
                    savedGameState.hangulName

                if (!isValidSavedState) {
                    hangulStats.clearGameState()
                    const newImages = await getMultipleRandomHangulImages(5, currentFilter)
                    setIsLoading(false)

                    if (newImages.length > 0) {
                        setPrefetchedImages(newImages)
                        setCurrentImageIndex(1)
                        guessesLoadedRef.current = true
                        setHangulImage(newImages[0])
                        setHangulName(newImages[0].hangul_name)
                        setSkipsRemaining(3)
                        setImageRevealed(false)
                        if (newImages[0].name) setCorrectAnswer(newImages[0].name.toUpperCase())
                        if (newImages[0].img_bucket) addSeenHangulIdol(newImages[0].img_bucket)
                    }
                    loadHangulRef.current = false
                    return
                }

                const decodedName = decodeIdolName(savedGameState.encodedIdolName)
                const decodedAltName = savedGameState.encodedAltName
                    ? decodeIdolName(savedGameState.encodedAltName)
                    : undefined

                const savedImage: HangulImage = {
                    id: 0,
                    name: decodedName,
                    alt_name: decodedAltName,
                    hangul_name: savedGameState.hangulName,
                    group_type: savedGameState.groupType,
                    img_bucket: savedGameState.imgBucket,
                    group_category: savedGameState.groupCategory,
                    base64_group: savedGameState.base64Group,
                    base64_idol: savedGameState.base64Idol,
                    group_name: savedGameState.groupName,
                }

                if (currentFilter !== null && savedImage.group_category !== currentFilter) {
                    hangulStats.clearGameState()
                    const newImages = await getMultipleRandomHangulImages(5, currentFilter)
                    setIsLoading(false)

                    if (newImages.length > 0) {
                        setPrefetchedImages(newImages)
                        setCurrentImageIndex(1)
                        guessesLoadedRef.current = true
                        setHangulImage(newImages[0])
                        setHangulName(newImages[0].hangul_name)
                        setSkipsRemaining(3)
                        setImageRevealed(false)
                        if (newImages[0].name) setCorrectAnswer(newImages[0].name.toUpperCase())
                        if (newImages[0].img_bucket) addSeenHangulIdol(newImages[0].img_bucket)
                    }
                    loadHangulRef.current = false
                    return
                }

                const savedGuesses: Array<'correct' | 'incorrect' | 'empty'> =
                    Array.isArray(savedGameState.guesses) && savedGameState.guesses.length === 3
                        ? (savedGameState.guesses as Array<'correct' | 'incorrect' | 'empty'>)
                        : ['empty', 'empty', 'empty']

                const hasWon = savedGameState.guesses?.includes('correct') || false
                const hasLost = savedGameState.guesses?.filter((g) => g === 'incorrect').length === 3 || false

                guessesLoadedRef.current = true
                justLoadedGuessesRef.current = true
                guessesRef.current = savedGuesses
                currentImageBucketRef.current = savedImage.img_bucket

                setGameWon(hasWon)
                setGameLost(hasLost)
                setGuesses(savedGuesses)

                Promise.resolve().then(() => {
                    setHangulImage(savedImage)
                    setHangulName(savedGameState.hangulName)
                    setCorrectAnswer(decodedName.toUpperCase())
                    setImageRevealed(savedGameState.imageRevealed || false)
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

                if (savedGameState.prefetchedImages && savedGameState.prefetchedImages.length > 0) {
                    const allImagesValid = savedGameState.prefetchedImages.every(
                        (img) => img.hangul_name
                    )

                    if (allImagesValid) {
                        const filteredPrefetched =
                            currentFilter !== null
                                ? savedGameState.prefetchedImages.filter(
                                      (img) => img.group_category === currentFilter
                                  )
                                : savedGameState.prefetchedImages

                        if (filteredPrefetched.length > 0) {
                            setPrefetchedImages(filteredPrefetched as HangulImage[])
                            setCurrentImageIndex(savedGameState.currentImageIndex || 0)
                        } else {
                            getMultipleRandomHangulImages(5, currentFilter).then((newImages) => {
                                setPrefetchedImages(newImages)
                                setCurrentImageIndex(0)
                                newImages.forEach((img) => {
                                    if (img.img_bucket) addSeenHangulIdol(img.img_bucket)
                                })
                            })
                        }
                    } else {
                        getMultipleRandomHangulImages(5, currentFilter).then((newImages) => {
                            setPrefetchedImages(newImages)
                            setCurrentImageIndex(0)
                            newImages.forEach((img) => {
                                if (img.img_bucket) addSeenHangulIdol(img.img_bucket)
                            })
                        })
                    }
                } else {
                    getMultipleRandomHangulImages(5, currentFilter).then((newImages) => {
                        setPrefetchedImages(newImages)
                        setCurrentImageIndex(0)
                        newImages.forEach((img) => {
                            if (img.img_bucket) addSeenHangulIdol(img.img_bucket)
                        })
                    })
                }
            } else {
                setIsLoading(true)
                const newImages = await getMultipleRandomHangulImages(5, currentFilter)
                setIsLoading(false)

                if (newImages.length > 0) {
                    setPrefetchedImages(newImages)
                    setCurrentImageIndex(1)
                    guessesLoadedRef.current = true
                    setHangulImage(newImages[0])
                    setHangulName(newImages[0].hangul_name)
                    setSkipsRemaining(3)
                    setImageRevealed(false)
                    if (newImages[0].name) setCorrectAnswer(newImages[0].name.toUpperCase())
                    newImages.forEach((img) => {
                        if (img.img_bucket) addSeenHangulIdol(img.img_bucket)
                    })
                }
            }

            loadHangulRef.current = false
        },
        [hangulStats, groupFilter]
    )

    loadHangulRefFunc.current = loadHangul

    const loadNextHangul = useCallback(
        (
            overrideSkipsRemaining?: number,
            overrideImageRevealed?: boolean,
            overrideGroupFilter?: GroupFilter
        ) => {
            const effectiveFilter = overrideGroupFilter ?? groupFilter
            if (!gameWon && !gameLost) {
                const hasGuesses = guesses.some((g) => g === 'incorrect' || g === 'correct')
                if (hasGuesses) {
                    hangulStats.updateStats(false, true, true)
                }
                lastStreakMilestoneRef.current = 0
            }

            setCurrentGuess('')
            setLastIncorrectGuess('')
            const freshGuesses: Array<'correct' | 'incorrect' | 'empty'> = [
                'empty', 'empty', 'empty'
            ]
            setGuesses(freshGuesses)
            setIsAnimating(false)
            setShowConfetti(false)
            setGameWon(false)
            setGameLost(false)
            setShowWinModal(false)
            resetGuessTimer()
            lossRecordedRef.current = false
            hasTrackedCurrentGame.current = false

            const finalSkipsRemaining = overrideSkipsRemaining ?? skipsRemaining
            const finalImageRevealed = overrideImageRevealed ?? false

            if (overrideSkipsRemaining !== undefined) setSkipsRemaining(overrideSkipsRemaining)
            setImageRevealed(finalImageRevealed)

            const buildGameState = (
                row: HangulImage,
                nextImageIndex: number,
                images: HangulImage[]
            ) => ({
                groupType: row.group_type || '',
                imgBucket: row.img_bucket,
                groupCategory: row.group_category,
                base64Group: row.base64_group,
                base64Idol: row.base64_idol,
                encodedIdolName: encodeIdolName(row.name || ''),
                encodedAltName: row.alt_name ? encodeIdolName(row.alt_name) : undefined,
                hangulName: row.hangul_name,
                groupName: row.group_name,
                imageRevealed: finalImageRevealed,
                skipsRemaining: finalSkipsRemaining,
                guesses: freshGuesses,
                savedAt: new Date().toISOString(),
                prefetchedImages: images.map((img) => ({
                    id: img.id,
                    name: img.name,
                    alt_name: img.alt_name,
                    hangul_name: img.hangul_name,
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
                setHangulImage(row)
                setHangulName(row.hangul_name)
                if (row.name) setCorrectAnswer(row.name.toUpperCase())
                setCurrentImageIndex(nextImageIndex)
                setTimeout(() => {
                    justLoadedGuessesRef.current = false
                }, 300)

                hangulStats.saveGameState(buildGameState(row, nextImageIndex, prefetchedImages))

                if (prefetchedImages.length > nextImageIndex) {
                    const nextRow = prefetchedImages[nextImageIndex]
                    if (nextRow && nextRow.group_category && nextRow.base64_group) {
                        const imagesToPreload = ['hint', 'clear'].map((type) =>
                            getHangulImageUrl(
                                nextRow.group_category || '',
                                nextRow.base64_group || '',
                                nextRow.img_bucket,
                                type as 'hint' | 'clear'
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
                    getMultipleRandomHangulImages(5, apiFilter).then((newImages) => {
                        setPrefetchedImages((prev) => [...prev, ...newImages])
                        newImages.forEach((img) => {
                            if (img.img_bucket) addSeenHangulIdol(img.img_bucket)
                        })
                    })
                }
            } else {
                const apiFilter = effectiveFilter === 'both' ? null : effectiveFilter
                getMultipleRandomHangulImages(5, apiFilter).then((newImages) => {
                    if (newImages.length > 0) {
                        const basePrefetched = overrideGroupFilter ? [] : prefetchedImages
                        const updatedPrefetched = [...basePrefetched, ...newImages]
                        setPrefetchedImages(updatedPrefetched)
                        const row = newImages[0]
                        const nextImageIndex = basePrefetched.length
                        guessesLoadedRef.current = true
                        justLoadedGuessesRef.current = true
                        setHangulImage(row)
                        setHangulName(row.hangul_name)
                        if (row.name) setCorrectAnswer(row.name.toUpperCase())
                        setCurrentImageIndex(nextImageIndex + 1)
                        setTimeout(() => {
                            justLoadedGuessesRef.current = false
                        }, 300)

                        hangulStats.saveGameState(
                            buildGameState(row, nextImageIndex + 1, updatedPrefetched)
                        )

                        newImages.forEach((img) => {
                            if (img.img_bucket) addSeenHangulIdol(img.img_bucket)
                        })
                    }
                })
            }
        },
        [
            prefetchedImages,
            currentImageIndex,
            hangulStats,
            gameWon,
            gameLost,
            guesses,
            skipsRemaining,
            groupFilter,
        ]
    )

    const handlePlayAgain = useCallback(
        (overrideGroupFilter?: GroupFilter) => {
            setShowGameOver(false)
            lossRecordedRef.current = false
            hasTrackedCurrentGame.current = false
            hangulStats.clearGameState()
            clearSeenHangulIdols()

            if (overrideGroupFilter) {
                setGroupFilter(overrideGroupFilter)
                localStorage.setItem('idol-guessr-hangul-group-filter', overrideGroupFilter)
            }

            setPrefetchedImages([])
            setCurrentImageIndex(0)
            loadNextHangul(3, false, overrideGroupFilter)
        },
        [loadNextHangul, hangulStats]
    )

    const handleSkip = useCallback(() => {
        if (skipsRemaining > 0) {
            const newSkipsRemaining = skipsRemaining - 1
            setSkipsRemaining(newSkipsRemaining)
            loadNextHangul(newSkipsRemaining)
        }
    }, [skipsRemaining, loadNextHangul])

    const handleKeyPress = useCallback(
        (key: string) => {
            if (key === 'ENTER') {
                if (
                    currentGuess.trim() &&
                    guesses.some((g) => g === 'empty') &&
                    !isAnimating &&
                    !gameWon &&
                    !gameLost
                ) {
                    const normalizedGuess = currentGuess.toUpperCase().trim()
                    const normalizedName = hangulImage?.name?.toUpperCase().trim() || ''
                    const normalizedAltName = hangulImage?.alt_name?.toUpperCase().trim() || ''
                    let isCorrect = normalizedGuess === normalizedName
                    let matchedAnswer = normalizedName
                    if (normalizedAltName && !isCorrect) {
                        isCorrect = normalizedGuess === normalizedAltName
                        if (isCorrect) matchedAnswer = normalizedAltName
                    }

                    setIsAnimating(true)

                    if (!isCorrect) {
                        setLastIncorrectGuess(normalizedGuess)
                        setCurrentGuess('')

                        setTimeout(() => {
                            setIsAnimating(false)
                            setGuesses((prev) => {
                                const newGuesses = [...prev]
                                const emptyIndex = newGuesses.findIndex((g) => g === 'empty')
                                if (emptyIndex === -1) return prev
                                newGuesses[emptyIndex] = 'incorrect'
                                const remainingAfterThis = newGuesses.filter((g) => g === 'empty').length
                                if (remainingAfterThis === 0) {
                                    setTimeout(() => {
                                        const streakBeforeReset = hangulStats.stats.currentStreak
                                        setFinalStreak(streakBeforeReset)
                                        setGameLost(true)
                                        if (!lossRecordedRef.current) {
                                            lossRecordedRef.current = true
                                            if (hangulImage?.id && !hasTrackedCurrentGame.current && streakBeforeReset >= 1) {
                                                void trackHangulGame(hangulImage.id, 3, streakBeforeReset)
                                                hasTrackedCurrentGame.current = true
                                            }
                                            hangulStats.updateStats(false, true)
                                        }
                                        hangulStats.clearGameState()
                                        lastStreakMilestoneRef.current = 0
                                        clearSeenHangulIdols()
                                    }, 300)
                                }
                                return newGuesses
                            })
                        }, 500)
                    } else {
                        const emptyIndex = guesses.findIndex((g) => g === 'empty')
                        setGameWon(true)
                        setCorrectAnswer(matchedAnswer)
                        setIsAnimating(false)
                        setCurrentGuess('')
                        setGuesses((prev) => {
                            const newGuesses = [...prev]
                            if (emptyIndex === -1) return prev
                            newGuesses[emptyIndex] = 'correct'
                            return newGuesses
                        })

                        const currentStreak = hangulStats.stats.currentStreak
                        const newStreak = currentStreak + 1
                        if (newStreak % 5 === 0) {
                            setStreakMilestone(newStreak)
                            setShowStreakPopup(true)
                        }
                        hangulStats.updateStats(true, false)
                        hangulStats.clearGameState()
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
            hangulImage,
            lastIncorrectGuess,
            hangulStats,
        ]
    )

    // Physical keyboard support
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
                handleKeyPress(key)
            }
        }
        window.addEventListener('keydown', handlePhysicalKeyPress)
        return () => window.removeEventListener('keydown', handlePhysicalKeyPress)
    }, [handleKeyPress])

    // Initial load
    const hasLoadedInitialRef = useRef(false)

    useEffect(() => {
        if (hasLoadedInitialRef.current) return
        hasLoadedInitialRef.current = true

        const savedFilter = localStorage.getItem('idol-guessr-hangul-group-filter')
        if (savedFilter === 'boy-group' || savedFilter === 'girl-group' || savedFilter === 'both') {
            setGroupFilter(savedFilter as GroupFilter)
        }

        if (loadHangulRefFunc.current) {
            void loadHangulRefFunc.current(
                savedFilter === 'boy-group' || savedFilter === 'girl-group' || savedFilter === 'both'
                    ? (savedFilter as GroupFilter)
                    : undefined
            )
        }
        resetGuessTimer()
    }, [])

    // Window dimensions for confetti
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

    // Auto advance after win/loss
    useEffect(() => {
        if (gameWon || gameLost) {
            if (gameLost) {
                const timer = setTimeout(() => {
                    setShowGameOver(true)
                }, 2000)
                return () => clearTimeout(timer)
            } else {
                const delay = showStreakPopup ? 2400 : 2000
                const timer = setTimeout(() => {
                    loadNextHangul()
                }, delay)
                return () => clearTimeout(timer)
            }
        }
    }, [gameWon, gameLost, loadNextHangul, showStreakPopup])

    // Save game state on guesses change
    useEffect(() => {
        if (
            hangulImage &&
            !gameWon &&
            !gameLost &&
            guesses.length === 3 &&
            guessesLoadedRef.current &&
            currentImageBucketRef.current === hangulImage.img_bucket &&
            !justLoadedGuessesRef.current
        ) {
            const allEmpty = guesses.every((g) => g === 'empty')
            if (allEmpty) {
                return
            }
            hangulStats.saveGameState({
                groupType: hangulImage.group_type || '',
                imgBucket: hangulImage.img_bucket,
                groupCategory: hangulImage.group_category,
                base64Group: hangulImage.base64_group,
                base64Idol: hangulImage.base64_idol,
                encodedIdolName: encodeIdolName(hangulImage.name || ''),
                encodedAltName: hangulImage.alt_name
                    ? encodeIdolName(hangulImage.alt_name)
                    : undefined,
                hangulName: hangulImage.hangul_name,
                groupName: hangulImage.group_name,
                imageRevealed: imageRevealed,
                skipsRemaining: skipsRemaining,
                guesses: guesses,
                savedAt: new Date().toISOString(),
                prefetchedImages: prefetchedImages.map((img) => ({
                    id: img.id,
                    name: img.name,
                    alt_name: img.alt_name,
                    hangul_name: img.hangul_name,
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
        hangulImage,
        gameWon,
        gameLost,
        guesses,
        imageRevealed,
        skipsRemaining,
        prefetchedImages,
        currentImageIndex,
        hangulStats,
    ])

    const handleStart = useCallback(
        (filter: GroupFilter) => {
            setGroupFilter(filter)
            localStorage.setItem('idol-guessr-hangul-group-filter', filter)
            if (loadHangulRefFunc.current) {
                void loadHangulRefFunc.current(filter)
            }
        },
        []
    )

    return {
        // Core state
        isLoading,
        hangulImage,
        hangulName,
        remainingGuesses,
        gameWon,
        gameLost,
        guesses,
        // Input state
        currentGuess,
        correctAnswer,
        lastIncorrectGuess,
        isAnimating,
        handleKeyPress,
        // Image reveal
        imageRevealed,
        setImageRevealed,
        // UI state
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
        // Streak
        showStreakPopup,
        streakMilestone,
        setShowStreakPopup,
        setStreakMilestone,
        // Game over
        showGameOver,
        handlePlayAgain,
        handleSkip,
        loadNextHangul,
        skipsRemaining,
        finalStreak,
        // Stats
        hangulCurrentStreak: hangulStats.stats.currentStreak,
        hangulMaxStreak: hangulStats.stats.maxStreak,
        hangulStatsData: hangulStats.stats,
        hangulStatsLoaded: hangulStats.isLoaded,
        // Filter
        groupFilter,
        handleStart,
    }
}
