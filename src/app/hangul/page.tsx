'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Confetti from 'react-confetti'
import GameHeader from '@/components/game/GameHeader'
import HangulDisplay from '@/components/game/HangulDisplay'
import GuessInput from '@/components/game/GuessInput'
import OnScreenKeyboard from '@/components/input/OnScreenKeyboard'
import StatsModal from '@/components/modals/StatsModal'
import HelpModal from '@/components/modals/HelpModal'
import FeedbackModal from '@/components/modals/FeedbackModal'
import InfoModal from '@/components/modals/InfoModal'
import WinModal from '@/components/modals/WinModal'
import HangulStartModal from '@/components/modals/HangulStartModal'
import HangulFilterModal from '@/components/filters/HangulFilterModal'
import { useHangulGameController } from '@/hooks/useHangulGameController'
import { getImageUrl } from '@/lib/supabase'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'

export default function HangulPage() {
    const router = useRouter()
    const [startOpen, setStartOpen] = useState(false)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const {
        isLoading,
        hangulImage,
        hangulName,
        remainingGuesses,
        gameWon,
        gameLost,
        guesses,
        currentGuess,
        correctAnswer,
        lastIncorrectGuess,
        isAnimating,
        handleKeyPress,
        imageRevealed,
        setImageRevealed,
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
        showStreakPopup,
        streakMilestone,
        setShowStreakPopup,
        showGameOver,
        handlePlayAgain,
        handleSkip,
        loadNextHangul,
        skipsRemaining,
        finalStreak,
        hangulCurrentStreak,
        hangulStatsData,
        hangulStatsLoaded,
        handleStart,
    } = useHangulGameController()

    const onStartGame = (filter: GroupFilter) => {
        handleStart(filter)
        setStartOpen(false)
    }

    useEffect(() => {
        try {
            const savedFilter = localStorage.getItem('idol-guessr-hangul-group-filter')
            if (savedFilter === 'boy-group' || savedFilter === 'girl-group' || savedFilter === 'both') {
                setStartOpen(false)
            } else {
                setStartOpen(true)
            }
        } catch {
            setStartOpen(true)
        }
    }, [])

    return (
        <div className='fixed inset-0 flex flex-col justify-center overflow-hidden bg-white'>
            <div className='mx-auto flex h-full w-full max-w-none flex-col sm:max-h-[900px] sm:max-w-md sm:rounded-[15px] sm:border-1 sm:border-gray-200 sm:shadow-lg'>
                <GameHeader
                    timer={''}
                    onShowStats={() => setShowStats(true)}
                    onShowInfo={() => setShowInfo(true)}
                    gameMode={'hangul'}
                    onGameModeChange={() => {
                        /* disabled in hangul mode */
                    }}
                    showModeToggle={false}
                    currentStreak={hangulCurrentStreak}
                    onLogoClick={() => router.push('/', { scroll: false })}
                />

                <div className='flex min-h-0 w-full flex-1 flex-col px-4'>
                    <div className='flex min-h-0 w-full flex-1 flex-col items-center'>
                        <HangulDisplay
                            isLoading={isLoading}
                            hangulName={hangulName}
                            hangulImage={
                                hangulImage && {
                                    group_type: hangulImage.group_type || '',
                                    img_bucket: hangulImage.img_bucket,
                                    group_category: hangulImage.group_category,
                                    base64_group: hangulImage.base64_group,
                                    base64_idol: hangulImage.base64_idol,
                                    group_name: hangulImage.group_name,
                                }
                            }
                            remainingGuesses={remainingGuesses}
                            gameWon={gameWon}
                            gameLost={gameLost}
                            imageRevealed={imageRevealed}
                            onRevealImage={() => setImageRevealed(true)}
                            onPass={
                                !gameWon && !gameLost && skipsRemaining > 0
                                    ? handleSkip
                                    : undefined
                            }
                            skipsRemaining={skipsRemaining}
                            showStreakPopup={showStreakPopup}
                            streakMilestone={streakMilestone}
                            onStreakPopupComplete={() => setShowStreakPopup(false)}
                            showGameOver={showGameOver}
                            currentStreak={finalStreak}
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
                stats={hangulStatsData}
                statsLoaded={hangulStatsLoaded}
                gameMode={'hangul'}
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
                    hangulImage &&
                    hangulImage.group_category &&
                    hangulImage.base64_group
                        ? getImageUrl(
                              hangulImage.group_type || '',
                              hangulImage.img_bucket,
                              'clear',
                              'unlimited',
                              hangulImage.group_category,
                              hangulImage.base64_group
                          )
                        : ''
                }
                pixelatedImageUrl={
                    hangulImage &&
                    hangulImage.group_category &&
                    hangulImage.base64_group
                        ? getImageUrl(
                              hangulImage.group_type || '',
                              hangulImage.img_bucket,
                              1,
                              'unlimited',
                              hangulImage.group_category,
                              hangulImage.base64_group
                          )
                        : ''
                }
                guessCount={6 - guesses.filter((g) => g === 'empty').length}
                isWin={gameWon}
                guessAttempts={[]}
                stats={{
                    gamesPlayed: hangulStatsData.totalGames,
                    winPercentage:
                        hangulStatsData.totalGames > 0
                            ? Math.round(
                                  (hangulStatsData.totalWins / hangulStatsData.totalGames) * 100
                              )
                            : 0,
                    currentStreak: hangulStatsData.currentStreak,
                    maxStreak: hangulStatsData.maxStreak,
                }}
                guessDistribution={[0, 0, 0, 0, 0, 0]}
                gameMode={'hangul'}
                onNextUnlimited={loadNextHangul}
            />

            {startOpen && <HangulStartModal isOpen={startOpen} onStart={onStartGame} />}

            <HangulFilterModal
                isOpen={showFilterModal}
                onClose={() => setShowFilterModal(false)}
                onConfirm={(filter) => {
                    setShowFilterModal(false)
                    handlePlayAgain(filter)
                }}
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
