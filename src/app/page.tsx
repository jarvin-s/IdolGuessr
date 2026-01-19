'use client'

import Confetti from 'react-confetti'
import OnScreenKeyboard from '@/components/input/OnScreenKeyboard'
import GameHeader from '@/components/game/GameHeader'
import GameImage from '@/components/game/GameImage'
import GuessInput from '@/components/game/GuessInput'
import StatsModal from '@/components/modals/StatsModal'
import HelpModal from '@/components/modals/HelpModal'
import FeedbackModal from '@/components/modals/FeedbackModal'
import InfoModal from '@/components/modals/InfoModal'
import HistoryModal from '@/components/modals/HistoryModal'
import WinModal from '@/components/modals/WinModal'
import { getImageUrl, getDailyImageByDate, type HistoryDailyImage } from '@/lib/supabase'
import { useGameController } from '@/hooks/useGameController'
import IndexModal from '@/components/modals/IndexModal'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef, useCallback } from 'react'
import idolNames from '@/data/idolNames.json'

const idolNamesSet = new Set(idolNames.map((name: string) => name.toUpperCase()))

export default function Home() {
    const router = useRouter()
    const [showIndexModal, setShowIndexModal] = useState(true)
    const [showInfo, setShowInfo] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [historyDate, setHistoryDate] = useState<string | null>(null)
    const [historyImage, setHistoryImage] = useState<HistoryDailyImage | null>(null)
    const [historyGuesses, setHistoryGuesses] = useState<Array<'correct' | 'incorrect' | 'empty'>>(['empty', 'empty', 'empty', 'empty', 'empty', 'empty'])
    const [historyGameWon, setHistoryGameWon] = useState(false)
    const [historyGameLost, setHistoryGameLost] = useState(false)
    const [historyCurrentGuess, setHistoryCurrentGuess] = useState('')
    const [historyLastIncorrectGuess, setHistoryLastIncorrectGuess] = useState('')
    const [historyIsAnimating, setHistoryIsAnimating] = useState(false)
    const [historyDisabledLetters, setHistoryDisabledLetters] = useState<Set<string>>(new Set())
    const [historyNotInList, setHistoryNotInList] = useState(false)
    const [historyShowWinModal, setHistoryShowWinModal] = useState(false)
    const hasShownWinModalRef = useRef(false)
    const {
        gameMode,
        handleGameModeChange,
        timer,
        isLoading,
        dailyImage,
        remainingGuesses,
        gameWon,
        gameLost,
        guesses,
        currentGuess,
        correctAnswer,
        lastIncorrectGuess,
        isAnimating,
        handleKeyPress,
        disabledLetters,
        notInList,
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
        stats,
        statsLoaded,
        todayCompletionData,
        loadGuessAttempts,
        skipsRemaining,
        hintUsed,
        setHintUsed,
        hintUsedOnIdol,
        setHintUsedOnIdol,
        showStreakPopup,
        streakMilestone,
        setShowStreakPopup,
        showGameOver,
        handlePlayAgain,
        handleSkip,
        loadNextUnlimited,
        unlimitedCurrentStreak,
        unlimitedMaxStreak,
    } = useGameController()

    const isInHistoryMode = historyDate !== null && historyImage !== null

    const historyCorrectAnswer = historyImage?.name?.toUpperCase() || ''
    const historyRemainingGuesses = historyGuesses.filter((g) => g === 'empty').length

    // Load history game progress from localStorage
    const loadHistoryProgress = useCallback((date: string) => {
        try {
            const saved = localStorage.getItem(`idol-guessr-history-${date}`)
            if (saved) {
                const data = JSON.parse(saved)
                setHistoryGuesses(data.guesses || ['empty', 'empty', 'empty', 'empty', 'empty', 'empty'])
                setHistoryGameWon(data.won || false)
                setHistoryGameLost(data.lost || false)
                setHistoryDisabledLetters(new Set(data.disabledLetters || []))
                return data
            }
        } catch {}
        return null
    }, [])

    const saveHistoryProgress = useCallback((date: string, guesses: Array<'correct' | 'incorrect' | 'empty'>, won: boolean, lost: boolean, disabledLetters: Set<string>) => {
        try {
            localStorage.setItem(`idol-guessr-history-${date}`, JSON.stringify({
                guesses,
                won,
                lost,
                disabledLetters: Array.from(disabledLetters)
            }))
        } catch {}
    }, [])

    const handleSelectHistoryDate = useCallback(async (date: string) => {
        setShowHistory(false)
        const image = await getDailyImageByDate(date)
        if (image) {
            setHistoryDate(date)
            setHistoryImage(image)
            setHistoryCurrentGuess('')
            setHistoryLastIncorrectGuess('')
            setHistoryIsAnimating(false)
            setHistoryNotInList(false)
            
            // Try to load saved progress
            const saved = loadHistoryProgress(date)
            if (!saved) {
                // Fresh game
                setHistoryGuesses(['empty', 'empty', 'empty', 'empty', 'empty', 'empty'])
                setHistoryGameWon(false)
                setHistoryGameLost(false)
                setHistoryDisabledLetters(new Set())
            }
        }
    }, [loadHistoryProgress])

    const handleExitHistoryMode = useCallback(() => {
        setHistoryDate(null)
        setHistoryImage(null)
        setHistoryGuesses(['empty', 'empty', 'empty', 'empty', 'empty', 'empty'])
        setHistoryGameWon(false)
        setHistoryGameLost(false)
        setHistoryCurrentGuess('')
        setHistoryLastIncorrectGuess('')
        setHistoryIsAnimating(false)
        setHistoryDisabledLetters(new Set())
        setHistoryNotInList(false)
        setHistoryShowWinModal(false)
    }, [])

    const handleHistoryKeyPress = useCallback((key: string) => {
        if (!historyDate || !historyImage) return
        
        if (key === 'ENTER') {
            if (
                historyCurrentGuess.trim() &&
                historyGuesses.some((g) => g === 'empty') &&
                !historyIsAnimating &&
                !historyGameWon &&
                !historyGameLost
            ) {
                const normalizedGuess = historyCurrentGuess.toUpperCase().trim()
                
                if (!idolNamesSet.has(normalizedGuess)) {
                    setHistoryNotInList(true)
                    setHistoryIsAnimating(true)
                    setTimeout(() => {
                        setHistoryIsAnimating(false)
                        setTimeout(() => setHistoryNotInList(false), 1000)
                    }, 500)
                    return
                }

                const normalizedName = historyImage.name?.toUpperCase().trim() || ''
                const isCorrect = normalizedGuess === normalizedName

                setHistoryIsAnimating(true)

                if (!isCorrect) {
                    setHistoryLastIncorrectGuess(normalizedGuess)
                    setHistoryCurrentGuess('')

                    const correctLetters = new Set(normalizedName.split(''))
                    const incorrectLettersInGuess = normalizedGuess
                        .split('')
                        .filter((letter) => !correctLetters.has(letter))

                    const newDisabledLetters = new Set(historyDisabledLetters)
                    incorrectLettersInGuess.forEach((letter) => newDisabledLetters.add(letter))
                    setHistoryDisabledLetters(newDisabledLetters)

                    setTimeout(() => {
                        setHistoryIsAnimating(false)
                        setHistoryGuesses((prev) => {
                            const newGuesses = [...prev] as Array<'correct' | 'incorrect' | 'empty'>
                            const emptyIndex = newGuesses.findIndex((g) => g === 'empty')
                            if (emptyIndex === -1) return prev
                            newGuesses[emptyIndex] = 'incorrect'
                            
                            const remainingAfterThis = newGuesses.filter((g) => g === 'empty').length
                            if (remainingAfterThis === 0) {
                                setTimeout(() => {
                                    setHistoryGameLost(true)
                                    saveHistoryProgress(historyDate, newGuesses, false, true, newDisabledLetters)
                                    setTimeout(() => setHistoryShowWinModal(true), 2000)
                                }, 300)
                            } else {
                                saveHistoryProgress(historyDate, newGuesses, false, false, newDisabledLetters)
                            }
                            return newGuesses
                        })
                    }, 500)
                } else {
                    const emptyIndex = historyGuesses.findIndex((g) => g === 'empty')
                    setHistoryGameWon(true)
                    setHistoryIsAnimating(false)
                    setHistoryCurrentGuess('')
                    setHistoryGuesses((prev) => {
                        const newGuesses = [...prev] as Array<'correct' | 'incorrect' | 'empty'>
                        if (emptyIndex === -1) return prev
                        newGuesses[emptyIndex] = 'correct'
                        saveHistoryProgress(historyDate, newGuesses, true, false, historyDisabledLetters)
                        return newGuesses
                    })
                    setTimeout(() => setHistoryShowWinModal(true), 2000)
                }
            }
        } else if (key === '✕') {
            if (!historyGameWon && !historyGameLost) {
                if (historyCurrentGuess === '' && historyLastIncorrectGuess) {
                    setHistoryCurrentGuess(historyLastIncorrectGuess.slice(0, -1))
                    setHistoryLastIncorrectGuess('')
                } else {
                    setHistoryCurrentGuess((prev) => prev.slice(0, -1))
                }
            }
        } else {
            if (
                historyGuesses.some((g) => g === 'empty') &&
                !historyIsAnimating &&
                !historyGameWon &&
                !historyGameLost &&
                historyCurrentGuess.length < 20
            ) {
                if (historyLastIncorrectGuess) setHistoryLastIncorrectGuess('')
                setHistoryCurrentGuess((prev) => prev + key)
            }
        }
    }, [historyDate, historyImage, historyCurrentGuess, historyGuesses, historyIsAnimating, historyGameWon, historyGameLost, historyLastIncorrectGuess, historyDisabledLetters, saveHistoryProgress])

    // Handle physical keyboard for history mode
    useEffect(() => {
        if (!isInHistoryMode) return

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
                handleHistoryKeyPress('ENTER')
            } else if (key === 'BACKSPACE') {
                handleHistoryKeyPress('✕')
            } else if (/^[A-Z]$/.test(key)) {
                if (!historyDisabledLetters.has(key)) {
                    handleHistoryKeyPress(key)
                }
            }
        }
        window.addEventListener('keydown', handlePhysicalKeyPress)
        return () => window.removeEventListener('keydown', handlePhysicalKeyPress)
    }, [isInHistoryMode, handleHistoryKeyPress, historyDisabledLetters])

    useEffect(() => {
        try {
            localStorage.setItem('idol-guessr-game-mode', 'daily')
        } catch {}
        if (gameMode !== 'daily') {
            handleGameModeChange('daily')
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameMode])

    // Auto-show win modal when daily game is already completed (only once on page load)
    useEffect(() => {
        if (
            gameMode === 'daily' &&
            todayCompletionData &&
            !showWinModal &&
            !hasShownWinModalRef.current
        ) {
            hasShownWinModalRef.current = true
            const timer = setTimeout(() => {
                setShowWinModal(true)
            }, 1000)
            return () => clearTimeout(timer)
        }
    }, [gameMode, todayCompletionData, showWinModal, setShowWinModal])

    const formatHistoryDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        })
    }

    return (
        <div className='fixed inset-0 flex flex-col justify-center overflow-hidden bg-white'>
            <div className='mx-auto flex h-full w-full max-w-none flex-col sm:max-h-[900px] sm:max-w-md sm:rounded-[15px] sm:border-1 sm:border-gray-200 sm:shadow-lg'>
                {isInHistoryMode ? (
                    <div className='flex w-full flex-shrink-0 flex-col gap-3 p-4'>
                        <div className='flex w-full items-center justify-between'>
                            <button
                                onClick={handleExitHistoryMode}
                                className='flex items-center cursor-pointer gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-200'
                            >
                                <svg className='h-4 w-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
                                </svg>
                                Back to today
                            </button>
                            <div className='flex flex-col items-end text-right'>
                                <div className='text-xs font-medium text-gray-400'>
                                    PAST IDOL
                                </div>
                                <div className='text-sm font-medium text-pink-600'>
                                    {formatHistoryDate(historyDate!)}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <GameHeader
                        timer={timer}
                        onShowStats={() => setShowStats(true)}
                        onShowInfo={() => setShowInfo(true)}
                        gameMode={gameMode}
                        onGameModeChange={handleGameModeChange}
                        showModeToggle={false}
                        currentStreak={
                            gameMode === 'unlimited'
                                ? unlimitedCurrentStreak
                                : undefined
                        }
                        onLogoClick={() => {
                            setShowIndexModal(true)
                        }}
                    />
                )}

                <div className='flex min-h-0 w-full flex-1 flex-col px-4'>
                    <div className='flex min-h-0 w-full flex-1 flex-col items-center'>
                        <GameImage
                            isLoading={isInHistoryMode ? false : isLoading}
                            dailyImage={
                                isInHistoryMode && historyImage
                                    ? {
                                          group_type: historyImage.group_type || '',
                                          img_bucket: historyImage.img_bucket,
                                          group_category: historyImage.group_category,
                                          base64_group: historyImage.base64_group,
                                          base64_idol: historyImage.base64_idol,
                                          group_name: historyImage.group_name,
                                      }
                                    : dailyImage && {
                                          group_type: dailyImage.group_type || '',
                                          img_bucket: dailyImage.img_bucket,
                                          group_category: dailyImage.group_category,
                                          base64_group: dailyImage.base64_group,
                                          base64_idol: dailyImage.base64_idol,
                                          group_name: dailyImage.group_name,
                                      }
                            }
                            remainingGuesses={isInHistoryMode ? historyRemainingGuesses : remainingGuesses}
                            gameWon={isInHistoryMode ? historyGameWon : gameWon}
                            gameLost={isInHistoryMode ? historyGameLost : gameLost}
                            gameMode={gameMode}
                            onPass={
                                !isInHistoryMode &&
                                gameMode === 'unlimited' &&
                                !gameWon &&
                                !gameLost &&
                                skipsRemaining > 0
                                    ? handleSkip
                                    : undefined
                            }
                            skipsRemaining={skipsRemaining}
                            hintUsed={hintUsed}
                            hintUsedOnIdol={hintUsedOnIdol}
                            onHintUse={() => {
                                setHintUsed(true)
                                if (dailyImage?.img_bucket)
                                    setHintUsedOnIdol(dailyImage.img_bucket)
                            }}
                            showStreakPopup={showStreakPopup}
                            streakMilestone={streakMilestone}
                            onStreakPopupComplete={() =>
                                setShowStreakPopup(false)
                            }
                            showGameOver={showGameOver}
                            highestStreak={unlimitedMaxStreak}
                            onPlayAgain={handlePlayAgain}
                            guesses={isInHistoryMode ? historyGuesses : guesses}
                        />
                    </div>

                    <GuessInput
                        currentGuess={isInHistoryMode ? historyCurrentGuess : currentGuess}
                        correctAnswer={isInHistoryMode ? historyCorrectAnswer : correctAnswer}
                        gameWon={isInHistoryMode ? historyGameWon : gameWon}
                        gameLost={isInHistoryMode ? historyGameLost : gameLost}
                        lastIncorrectGuess={isInHistoryMode ? historyLastIncorrectGuess : lastIncorrectGuess}
                        isAnimating={isInHistoryMode ? historyIsAnimating : isAnimating}
                        notInList={isInHistoryMode ? historyNotInList : notInList}
                    />

                    <OnScreenKeyboard
                        onKeyPress={isInHistoryMode ? handleHistoryKeyPress : handleKeyPress}
                        disabledLetters={isInHistoryMode ? historyDisabledLetters : disabledLetters}
                        className='flex-shrink-0 pb-4'
                    />
                </div>
            </div>

            <StatsModal
                isOpen={showStats}
                onClose={() => setShowStats(false)}
                stats={stats}
                statsLoaded={statsLoaded}
                gameMode={'daily'}
            />

            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                onBack={() => {
                    setShowHelp(false)
                    setShowInfo(true)
                }}
            />

            <FeedbackModal
                isOpen={showFeedback}
                onClose={() => setShowFeedback(false)}
                onBack={() => {
                    setShowFeedback(false)
                    setShowInfo(true)
                }}
            />

            <InfoModal
                isOpen={showInfo}
                onClose={() => setShowInfo(false)}
                onShowFeedback={() => {
                    setShowInfo(false)
                    setShowFeedback(true)
                }}
                onShowHelp={() => {
                    setShowInfo(false)
                    setShowHelp(true)
                }}
                onShowHistory={() => {
                    setShowInfo(false)
                    setShowHistory(true)
                }}
            />

            <HistoryModal
                isOpen={showHistory}
                onClose={() => setShowHistory(false)}
                onSelectDate={handleSelectHistoryDate}
                onBack={() => {
                    setShowHistory(false)
                    setShowInfo(true)
                }}
            />

            <IndexModal
                isOpen={showIndexModal}
                onDaily={() => setShowIndexModal(false)}
                onInfinite={() => {
                    router.push('/infinite', { scroll: false })
                }}
                onHangul={() => {
                    router.push('/hangul', { scroll: false })
                }}
                onChallenge={() => {
                    router.push('/challenge', { scroll: false })
                }}
            />

            {gameMode === 'daily' && !isInHistoryMode && (
                <WinModal
                    isOpen={showWinModal}
                    onClose={() => setShowWinModal(false)}
                    idolName={correctAnswer}
                    imageUrl={
                        dailyImage
                            ? getImageUrl(
                                  dailyImage.group_type || '',
                                  dailyImage.img_bucket,
                                  'clear',
                                  gameMode,
                                  dailyImage.group_category,
                                  dailyImage.base64_group
                              )
                            : ''
                    }
                    pixelatedImageUrl={
                        dailyImage
                            ? getImageUrl(
                                  dailyImage.group_type || '',
                                  dailyImage.img_bucket,
                                  1,
                                  gameMode,
                                  dailyImage.group_category,
                                  dailyImage.base64_group
                              )
                            : ''
                    }
                    guessCount={
                        todayCompletionData?.guessCount ||
                        6 - guesses.filter((g) => g === 'empty').length
                    }
                    isWin={
                        todayCompletionData ? todayCompletionData.won : gameWon
                    }
                    guessAttempts={
                        todayCompletionData?.guessAttempts ||
                        loadGuessAttempts()
                    }
                    stats={{
                        gamesPlayed: stats.totalGames,
                        winPercentage:
                            stats.totalGames > 0
                                ? Math.round(
                                      (stats.totalWins / stats.totalGames) * 100
                                  )
                                : 0,
                        currentStreak: stats.currentStreak,
                        maxStreak: stats.maxStreak,
                    }}
                    guessDistribution={[
                        stats.guessDistribution[1] || 0,
                        stats.guessDistribution[2] || 0,
                        stats.guessDistribution[3] || 0,
                        stats.guessDistribution[4] || 0,
                        stats.guessDistribution[5] || 0,
                        stats.guessDistribution[6] || 0,
                    ]}
                    gameMode={gameMode}
                    onNextUnlimited={loadNextUnlimited}
                />
            )}

            {/* History mode win modal */}
            {isInHistoryMode && historyImage && (
                <WinModal
                    isOpen={historyShowWinModal}
                    onClose={() => setHistoryShowWinModal(false)}
                    idolName={historyCorrectAnswer}
                    imageUrl={getImageUrl(
                        historyImage.group_type || '',
                        historyImage.img_bucket,
                        'clear',
                        'daily',
                        historyImage.group_category,
                        historyImage.base64_group
                    )}
                    pixelatedImageUrl={getImageUrl(
                        historyImage.group_type || '',
                        historyImage.img_bucket,
                        1,
                        'daily',
                        historyImage.group_category,
                        historyImage.base64_group
                    )}
                    guessCount={6 - historyGuesses.filter((g) => g === 'empty').length}
                    isWin={historyGameWon}
                    guessAttempts={[]}
                    stats={{
                        gamesPlayed: stats.totalGames,
                        winPercentage:
                            stats.totalGames > 0
                                ? Math.round(
                                      (stats.totalWins / stats.totalGames) * 100
                                  )
                                : 0,
                        currentStreak: stats.currentStreak,
                        maxStreak: stats.maxStreak,
                    }}
                    guessDistribution={[
                        stats.guessDistribution[1] || 0,
                        stats.guessDistribution[2] || 0,
                        stats.guessDistribution[3] || 0,
                        stats.guessDistribution[4] || 0,
                        stats.guessDistribution[5] || 0,
                        stats.guessDistribution[6] || 0,
                    ]}
                    gameMode='daily'
                    onNextUnlimited={loadNextUnlimited}
                    isHistoryMode={true}
                    historyDate={historyDate!}
                />
            )}

            {showConfetti && windowDimensions.width > 0 && (
                <div className='pointer-events-none fixed inset-0 z-[9999]'>
                    <Confetti
                        width={windowDimensions.width}
                        height={windowDimensions.height}
                        recycle={false}
                        numberOfPieces={200}
                        gravity={0.3}
                    />
                </div>
            )}
        </div>
    )
}
