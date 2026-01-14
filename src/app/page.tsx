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
import WinModal from '@/components/modals/WinModal'
import { getImageUrl } from '@/lib/supabase'
import { useGameController } from '@/hooks/useGameController'
import IndexModal from '@/components/modals/IndexModal'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'

export default function Home() {
    const router = useRouter()
    const [showIndexModal, setShowIndexModal] = useState(true)
    const [showInfo, setShowInfo] = useState(false)
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

    return (
        <div className='fixed inset-0 flex flex-col justify-center overflow-hidden bg-white'>
            <div className='mx-auto flex h-full w-full max-w-none flex-col sm:max-h-[900px] sm:max-w-md sm:rounded-[15px] sm:border-1 sm:border-gray-200 sm:shadow-lg'>
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

                <div className='flex min-h-0 w-full flex-1 flex-col px-4'>
                    <div className='flex min-h-0 w-full flex-1 flex-col items-center'>
                        <GameImage
                            isLoading={isLoading}
                            dailyImage={
                                dailyImage && {
                                    group_type: dailyImage.group_type || '',
                                    img_bucket: dailyImage.img_bucket,
                                    group_category: dailyImage.group_category,
                                    base64_group: dailyImage.base64_group,
                                    base64_idol: dailyImage.base64_idol,
                                    group_name: dailyImage.group_name,
                                }
                            }
                            remainingGuesses={remainingGuesses}
                            gameWon={gameWon}
                            gameLost={gameLost}
                            gameMode={gameMode}
                            onPass={
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
                            guesses={guesses}
                        />
                    </div>

                    <GuessInput
                        currentGuess={currentGuess}
                        correctAnswer={correctAnswer}
                        gameWon={gameWon}
                        gameLost={gameLost}
                        lastIncorrectGuess={lastIncorrectGuess}
                        isAnimating={isAnimating}
                        notInList={notInList}
                    />

                    <OnScreenKeyboard
                        onKeyPress={handleKeyPress}
                        disabledLetters={disabledLetters}
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

            {gameMode === 'daily' && (
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
