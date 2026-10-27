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
import IdolTextInput from '@/components/input/IdolTextInput'
import { useInputMode } from '@/utils/inputMode'
import {
    loadSavedDifficulty,
    loadSavedImageMode,
    saveDifficulty,
    saveImageMode,
    type ImageMode,
    type InfiniteDifficulty,
} from '@/utils/difficulty'
import {
    DEFAULT_INFINITE_GEN_FILTER,
    isValidInfiniteGenFilter,
} from '@/utils/genFilter'

type GroupFilter = 'boy-group' | 'girl-group' | 'both'

export default function InfinitePage() {
    const router = useRouter()
    const [startOpen, setStartOpen] = useState(false)
    const [showFilterModal, setShowFilterModal] = useState(false)
    const [showInfo, setShowInfo] = useState(false)
    const [inputMode, , inputModeReady] = useInputMode()
    const {
        handleGameModeChange,
        imageMode,
        setImageMode,
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
        unlimitedStatsData,
        unlimitedStatsLoaded,
        difficulty,
        todayCompletionData,
        loadGuessAttempts,
        skipsRemaining,
        hintsRemaining,
        maxGuesses,
        maxHints,
        maxSkips,
        hintUsedOnIdol,
        setHintUsedOnIdol,
        consumeHint,
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

    const handleStart = (
        groupFilter: GroupFilter,
        genFilter: number[],
        difficulty: InfiniteDifficulty,
        selectedImageMode: ImageMode
    ) => {
        try {
            localStorage.setItem('idol-guessr-group-filter', groupFilter)
            localStorage.setItem('idol-guessr-gen-filter', JSON.stringify(genFilter))
            saveDifficulty(difficulty)
            saveImageMode(selectedImageMode)
        } catch {
            // Ignore localStorage errors
        }
        handleGameModeChange('unlimited', groupFilter, genFilter, difficulty, selectedImageMode)
        setStartOpen(false)
    }

    useEffect(() => {
        try {
            const savedGroupFilter = localStorage.getItem('idol-guessr-group-filter')
            const savedGenFilter = localStorage.getItem('idol-guessr-gen-filter')

            let parsedGenFilter = DEFAULT_INFINITE_GEN_FILTER
            if (savedGenFilter) {
                try {
                    const parsed = JSON.parse(savedGenFilter)
                    if (isValidInfiniteGenFilter(parsed)) {
                        parsedGenFilter = parsed
                    }
                } catch {
                    // Keep default
                }
            }

            const savedDifficulty = loadSavedDifficulty()
            const savedImageMode = loadSavedImageMode()
            setImageMode(savedImageMode)

            if (savedGroupFilter === 'boy-group' || savedGroupFilter === 'girl-group' || savedGroupFilter === 'both') {
                handleGameModeChange('unlimited', savedGroupFilter as GroupFilter, parsedGenFilter, savedDifficulty, savedImageMode)
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
        <div className='fixed inset-0 flex flex-col justify-center overflow-hidden bg-white dark:bg-zinc-950'>
            <div className='mx-auto flex h-full w-full max-w-none flex-col sm:max-h-[900px] sm:max-w-md sm:rounded-[15px] sm:border-1 sm:border-gray-200 sm:dark:border-zinc-700 sm:shadow-lg'>
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
                                    zoom_x: dailyImage.zoom_x,
                                    zoom_y: dailyImage.zoom_y,
                                }
                            }
                            imageMode={imageMode}
                            remainingGuesses={remainingGuesses}
                            gameWon={gameWon}
                            gameLost={gameLost}
                            gameMode={'unlimited'}
                            maxGuesses={maxGuesses}
                            maxHints={maxHints}
                            maxSkips={maxSkips}
                            onPass={
                                !gameWon &&
                                !gameLost &&
                                maxSkips > 0 &&
                                skipsRemaining > 0
                                    ? handleSkip
                                    : undefined
                            }
                            skipsRemaining={skipsRemaining}
                            hintsRemaining={hintsRemaining}
                            hintUsedOnIdol={hintUsedOnIdol}
                            onHintUse={() => {
                                consumeHint()
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

                    {!inputModeReady ? (
                        <div className='flex-shrink-0 pb-4 invisible' aria-hidden='true' />
                    ) : inputMode === 'text' ? (
                        <div className='flex-shrink-0 pb-4'>
                            <IdolTextInput
                                onSubmit={(guess) => handleKeyPress('ENTER', guess)}
                                disabled={gameWon || gameLost}
                                busy={isAnimating}
                                isAnimating={isAnimating}
                                notInList={notInList}
                                gameWon={gameWon}
                                gameLost={gameLost}
                                correctAnswer={correctAnswer}
                                revealOnWin
                            />
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>

            <StatsModal
                isOpen={showStats}
                onClose={() => setShowStats(false)}
                stats={unlimitedStatsData}
                statsLoaded={unlimitedStatsLoaded}
                gameMode={'unlimited'}
                difficulty={difficulty}
                imageMode={imageMode}
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
                onShowHistory={() => {}}
                gameMode='unlimited'
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
                guessCount={
                    maxGuesses - guesses.filter((g) => g === 'empty').length
                }
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
                onPlayAgain={(groupFilter, genFilter, difficulty, mode) => {
                    setImageMode(mode)
                    handlePlayAgain(groupFilter, genFilter, difficulty, mode)
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
