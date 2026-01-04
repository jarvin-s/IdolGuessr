'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Confetti from 'react-confetti'
import GameHeader from '@/components/game/GameHeader'
import GameImage from '@/components/game/GameImage'
import GuessInput from '@/components/game/GuessInput'
import OnScreenKeyboard from '@/components/input/OnScreenKeyboard'
import StatsModal from '@/components/modals/StatsModal'
import HelpModal from '@/components/modals/HelpModal'
import FeedbackModal from '@/components/modals/FeedbackModal'
import InfoModal from '@/components/modals/InfoModal'
import WinModal from '@/components/modals/WinModal'
import InfiniteStartModal from '@/components/modals/InfiniteStartModal'
import FilterModal from '@/components/filters/FilterModal'
import { useGameController } from '@/hooks/useGameController'
import { getImageUrl } from '@/lib/supabase'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'

export default function InfinitePage() {
    const router = useRouter()
    const [startOpen, setStartOpen] = useState(false)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const {
        handleGameModeChange,
        timer,
        isLoading,
        dailyImage,
        remainingGuesses,
        gameWon,
        gameLost,
        currentGuess,
        correctAnswer,
        lastIncorrectGuess,
        isAnimating,
        handleKeyPress,
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
        guesses,
    } = useGameController()

    const handleStart = (filter: GroupFilter) => {
        // Start unlimited with selected filter, then lock UI by closing modal
        handleGameModeChange('unlimited', filter)
        setStartOpen(false)
    }

    useEffect(() => {
        try {
            const savedFilter = localStorage.getItem('idol-guessr-group-filter')
            if (savedFilter === 'boy-group' || savedFilter === 'girl-group' || savedFilter === 'both') {
                handleGameModeChange('unlimited', savedFilter as GroupFilter)
                setStartOpen(false)
            } else {
                setStartOpen(true)
            }
        } catch {
            setStartOpen(true)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className='fixed inset-0 flex flex-col justify-center overflow-hidden bg-white'>
            <div className='mx-auto flex h-full w-full max-w-none flex-col sm:max-h-[900px] sm:max-w-md sm:rounded-[15px] sm:border-1 sm:border-gray-200 sm:shadow-lg'>
                <GameHeader
                    timer={timer}
                    onShowStats={() => setShowStats(true)}
                    onShowInfo={() => setShowInfo(true)}
                    gameMode={'unlimited'}
                    onGameModeChange={() => {
                        /* disabled in infinite */
                    }}
                    showModeToggle={false}
                    currentStreak={unlimitedCurrentStreak}
                    onLogoClick={() => router.push('/', { scroll: false })}
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
                            gameMode={'unlimited'}
                            onPass={
                                !gameWon && !gameLost && skipsRemaining > 0
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
                            onPlayAgain={() => setShowFilterModal(true)}
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
                        className='flex-shrink-0 pb-4'
                    />
                </div>
            </div>

            <StatsModal
                isOpen={showStats}
                onClose={() => setShowStats(false)}
                stats={stats}
                statsLoaded={statsLoaded}
                gameMode={'unlimited'}
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

            <WinModal
                isOpen={showWinModal}
                onClose={() => setShowWinModal(false)}
                idolName={correctAnswer}
                imageUrl={
                    dailyImage &&
                    dailyImage.group_category &&
                    dailyImage.base64_group
                        ? getImageUrl(
                              dailyImage.group_type || '',
                              dailyImage.img_bucket,
                              'clear',
                              'unlimited',
                              dailyImage.group_category,
                              dailyImage.base64_group
                          )
                        : ''
                }
                pixelatedImageUrl={
                    dailyImage &&
                    dailyImage.group_category &&
                    dailyImage.base64_group
                        ? getImageUrl(
                              dailyImage.group_type || '',
                              dailyImage.img_bucket,
                              1,
                              'unlimited',
                              dailyImage.group_category,
                              dailyImage.base64_group
                          )
                        : ''
                }
                guessCount={6 - guesses.filter((g) => g === 'empty').length}
                isWin={gameWon}
                guessAttempts={
                    todayCompletionData?.guessAttempts || loadGuessAttempts()
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
                guessDistribution={[0, 0, 0, 0, 0, 0]}
                gameMode={'unlimited'}
                onNextUnlimited={loadNextUnlimited}
            />

            {startOpen && (
                <InfiniteStartModal isOpen={startOpen} onStart={handleStart} />
            )}

            <FilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onConfirm={() => {
                    setShowFilterModal(false)
                }}
                onPlayAgain={handlePlayAgain}
            />

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
