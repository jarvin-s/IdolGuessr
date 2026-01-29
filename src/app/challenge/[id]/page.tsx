'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import GameHeader from '@/components/game/GameHeader'
import GameImage from '@/components/game/GameImage'
import GuessInput from '@/components/game/GuessInput'
import OnScreenKeyboard from '@/components/input/OnScreenKeyboard'
import ChallengeProgress from '@/components/challenge/ChallengeProgress'
import ChallengeCompleteModal from '@/components/challenge/ChallengeCompleteModal'
import ChallengeIntroModal from '@/components/challenge/ChallengeIntroModal'
import { useChallengeController } from '@/hooks/useChallengeController'

export default function ChallengePlayPage() {
    const params = useParams()
    const router = useRouter()
    const challengeId = params.id as string

    const {
        challenge,
        isLoading,
        error,
        alreadyPlayed,
        currentIndex,
        currentIdol,
        totalIdols,
        currentGuess,
        correctAnswer,
        lastIncorrectGuess,
        guesses,
        remainingGuesses,
        isAnimating,
        gameWon,
        gameLost,
        notInList,
        totalCorrect,
        isComplete,
        isSubmitting,
        handleKeyPress,
        submitResults,
        results,
    } = useChallengeController(challengeId)

    const [showIntro, setShowIntro] = useState(false)

    useEffect(() => {
        if (challenge && currentIndex === 0 && !isLoading && results.length === 0) {
            const savedProgress = localStorage.getItem('idol-guessr-challenge-progress')
            if (!savedProgress) {
                setShowIntro(true)
            }
        }
    }, [challenge, currentIndex, isLoading, results.length])

    useEffect(() => {
        if (alreadyPlayed) {
            router.push(`/challenge/${challengeId}/results`)
        }
    }, [alreadyPlayed, challengeId, router])

    const handleSubmitResults = async (nickname: string | null) => {
        const success = await submitResults(nickname)
        if (success) {
            router.push(`/challenge/${challengeId}/results`)
        }
    }

    const handleStartChallenge = () => {
        setShowIntro(false)
    }

    if (isLoading) {
        return (
            <div className='fixed inset-0 flex items-center justify-center bg-white'>
                <div className='text-center'>
                    <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-pink-600 border-t-transparent' />
                    <p className='text-gray-600'>Loading challenge...</p>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className='fixed inset-0 flex items-center justify-center bg-white'>
                <div className='max-w-md p-8 text-center'>
                    <h1 className='mb-2 text-2xl font-bold'>
                        Challenge not found
                    </h1>
                    <p className='mb-6 text-gray-600'>{error}</p>
                    <button
                        onClick={() => router.push('/challenge')}
                        className='cursor-pointer rounded-full bg-pink-600 px-6 py-2 font-bold text-white transition-colors hover:bg-pink-700'
                    >
                        Create new challenge
                    </button>
                </div>
            </div>
        )
    }

    // Already played - show loading while redirecting
    if (alreadyPlayed) {
        return (
            <div className='fixed inset-0 flex items-center justify-center bg-white'>
                <div className='text-center'>
                    <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-pink-600 border-t-transparent' />
                    <p className='text-gray-600'>Loading results...</p>
                </div>
            </div>
        )
    }

    return (
        <div className='fixed inset-0 flex flex-col justify-center overflow-hidden bg-white'>
            {challenge && (
                <ChallengeIntroModal
                    isOpen={showIntro}
                    idolCount={challenge.idol_count}
                    groupFilter={challenge.group_filter}
                    onStart={handleStartChallenge}
                />
            )}
            {!showIntro && (
                <div className='mx-auto flex h-full w-full max-w-none flex-col sm:max-h-[900px] sm:max-w-md sm:rounded-[15px] sm:border-1 sm:border-gray-200 sm:shadow-lg'>
                    <GameHeader
                        timer={`${currentIndex + 1}/${totalIdols}`}
                        onShowStats={() => {}}
                        onShowInfo={() => {}}
                        gameMode={'unlimited'}
                        onGameModeChange={() => {}}
                        showModeToggle={false}
                        currentStreak={totalCorrect}
                        onLogoClick={() => router.push('/')}
                        isChallenge={true}
                    />

                    <ChallengeProgress current={currentIndex} total={totalIdols} />

                    <div className='flex min-h-0 w-full flex-1 flex-col px-4'>
                        <div className='flex min-h-0 w-full flex-1 flex-col items-center'>
                            <GameImage
                            isLoading={!currentIdol}
                            dailyImage={
                                currentIdol
                                    ? {
                                          group_type: '',
                                          img_bucket: currentIdol.img_bucket,
                                          group_category:
                                              currentIdol.group_category,
                                          base64_group:
                                              currentIdol.base64_group,
                                          group_name: currentIdol.group_name,
                                      }
                                    : null
                            }
                            remainingGuesses={remainingGuesses}
                            gameWon={gameWon}
                            gameLost={gameLost}
                            gameMode={'unlimited'}
                            skipsRemaining={0}
                            hintUsed={false}
                            showStreakPopup={false}
                            streakMilestone={0}
                            onStreakPopupComplete={() => {}}
                            showGameOver={false}
                            highestStreak={0}
                            onPlayAgain={() => {}}
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
            )}

            <ChallengeCompleteModal
                isOpen={isComplete}
                totalCorrect={totalCorrect}
                totalIdols={totalIdols}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmitResults}
            />
        </div>
    )
}
