import { getImageUrl } from '@/lib/supabase'
import StreakPopup from './StreakPopup'
import GameOverModal from './GameOverModal'
import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'

interface GameImageProps {
    isLoading: boolean
    dailyImage: {
        group_type: string
        img_bucket: string
        group_category?: string
        base64_group?: string
        base64_idol?: string
        group_name?: string
    } | null
    remainingGuesses: number
    gameWon: boolean
    gameLost: boolean
    gameMode: 'daily' | 'unlimited'
    onPass?: () => void
    skipsRemaining?: number
    hintUsed?: boolean
    hintUsedOnIdol?: string | null
    onHintUse?: () => void
    showStreakPopup?: boolean
    streakMilestone?: number
    onStreakPopupComplete?: () => void
    showGameOver?: boolean
    highestStreak?: number
    onPlayAgain?: () => void
    guesses?: Array<'empty' | 'correct' | 'incorrect'>
}

export default function GameImage({
    isLoading,
    dailyImage,
    remainingGuesses,
    gameWon,
    gameLost,
    gameMode,
    onPass,
    skipsRemaining = 3,
    hintUsed = false,
    hintUsedOnIdol = null,
    onHintUse,
    showStreakPopup,
    streakMilestone,
    onStreakPopupComplete,
    showGameOver = false,
    highestStreak = 0,
    onPlayAgain,
    guesses = [],
}: GameImageProps) {
    const [isEntering, setIsEntering] = useState(false)
    const [showMinusOne, setShowMinusOne] = useState(false)
    const [groupNameRevealed, setGroupNameRevealed] = useState(false)

    const prevIdolBucketRef = useRef<string | null>(null)

    useEffect(() => {
        if (dailyImage?.img_bucket) {
            const isNewIdol =
                prevIdolBucketRef.current !== dailyImage.img_bucket
            prevIdolBucketRef.current = dailyImage.img_bucket
            setIsEntering(true)
            if (isNewIdol) {
                setGroupNameRevealed(false)
            } else {
                setGroupNameRevealed(
                    hintUsed && hintUsedOnIdol === dailyImage.img_bucket
                )
            }
            const timer = setTimeout(() => setIsEntering(false), 50)
            return () => clearTimeout(timer)
        }
    }, [dailyImage?.img_bucket, hintUsed, hintUsedOnIdol])

    useEffect(() => {
        if (
            hintUsed &&
            hintUsedOnIdol &&
            dailyImage?.img_bucket === hintUsedOnIdol
        ) {
            setGroupNameRevealed(true)
        }
    }, [hintUsed, hintUsedOnIdol, dailyImage?.img_bucket])

    const getImageNumber = (): number | 'clear' => {
        if (
            gameWon ||
            gameLost ||
            remainingGuesses === 0 ||
            remainingGuesses === 1
        ) {
            return 'clear'
        }
        if (remainingGuesses === 6) return 1
        if (remainingGuesses === 5) return 2
        if (remainingGuesses === 4) return 3
        if (remainingGuesses === 3) return 4
        if (remainingGuesses === 2) return 5
        return 1
    }

    const imageNumber = getImageNumber()
    const hasValidData =
        !dailyImage ||
        gameMode === 'daily' ||
        (dailyImage.group_category && dailyImage.base64_group)

    const allImageUrls =
        dailyImage && hasValidData
            ? [1, 2, 3, 4, 5, 'clear'].map((num) =>
                  getImageUrl(
                      dailyImage.group_type || '',
                      dailyImage.img_bucket,
                      num as number | 'clear',
                      gameMode,
                      dailyImage.group_category,
                      dailyImage.base64_group
                  )
              )
            : []

    return (
        <div className='relative mb-3 min-h-0 w-full flex-1 sm:mx-auto sm:max-w-md'>
            <div className='relative h-full w-full overflow-hidden rounded-lg'>
                {isLoading || !hasValidData ? (
                    <div className='flex h-full w-full items-center justify-center'>
                        <div className='text-gray-400'>Loading...</div>
                    </div>
                ) : dailyImage ? (
                    <div
                        className='absolute inset-0 transition-transform duration-[1500ms] ease-out'
                        style={{
                            transform: isEntering
                                ? 'translateY(-100%)'
                                : 'translateY(0)',
                            zIndex: isEntering ? 100 : 10,
                        }}
                        key={dailyImage.img_bucket}
                    >
                        {allImageUrls.map((url, index) => {
                            const imageNum = index === 5 ? 'clear' : index + 1
                            const isVisible = imageNumber === imageNum
                            const currentIndex =
                                typeof imageNumber === 'number'
                                    ? imageNumber - 1
                                    : 5
                            const isPastImage = index < currentIndex
                            return (
                                <div
                                    key={url}
                                    className='absolute inset-0 overflow-hidden rounded-lg transition-all duration-500 ease-out'
                                    style={{
                                        opacity: isVisible ? 1 : 0,
                                        transform: isVisible
                                            ? 'translateX(0) rotate(0deg)'
                                            : isPastImage
                                              ? 'translateX(-150%) rotate(-15deg)'
                                              : 'translateX(150%) rotate(15deg)',
                                        pointerEvents: isVisible
                                            ? 'auto'
                                            : 'none',
                                    }}
                                >
                                    <Image
                                        src={url}
                                        alt='Daily idol'
                                        width={600}
                                        height={600}
                                        className='pointer-events-none rounded-lg object-cover'
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                        }}
                                        unoptimized
                                        priority={index === 0}
                                    />
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className='flex h-full w-full items-center justify-center'>
                        <div className='text-gray-400'>No image available</div>
                    </div>
                )}

                {gameMode === 'unlimited' && !gameWon && !gameLost && (
                    <>
                        <div className='absolute top-3 left-3 z-10 flex items-center gap-2'>
                            {dailyImage?.group_name && (
                                <button
                                    onClick={() => {
                                        if (
                                            dailyImage?.img_bucket &&
                                            !(
                                                hintUsed &&
                                                hintUsedOnIdol ===
                                                    dailyImage.img_bucket
                                            )
                                        ) {
                                            setGroupNameRevealed(true)
                                            onHintUse?.()
                                        }
                                    }}
                                    className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all md:text-sm ${
                                        hintUsed &&
                                        hintUsedOnIdol !== dailyImage.img_bucket
                                            ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                                            : 'text-black hover:scale-105 active:scale-95'
                                    }`}
                                    style={{
                                        backgroundColor:
                                            hintUsed &&
                                            hintUsedOnIdol !==
                                                dailyImage.img_bucket
                                                ? 'rgb(229, 229, 229)'
                                                : 'rgb(255, 249, 127)',
                                        border: '1px solid #00000012',
                                        cursor:
                                            hintUsed &&
                                            hintUsedOnIdol !==
                                                dailyImage.img_bucket
                                                ? 'not-allowed'
                                                : 'pointer',
                                    }}
                                    disabled={
                                        hintUsed &&
                                        hintUsedOnIdol !== dailyImage.img_bucket
                                    }
                                >
                                    <HintButton />
                                    {hintUsed &&
                                    hintUsedOnIdol !== dailyImage.img_bucket
                                        ? 'HINT (0)'
                                        : hintUsed &&
                                            hintUsedOnIdol ===
                                                dailyImage.img_bucket
                                          ? dailyImage.group_name
                                          : groupNameRevealed
                                            ? dailyImage.group_name
                                            : 'HINT (1)'}
                                </button>
                            )}
                        </div>
                        <div className='absolute top-3 right-3 z-10'>
                            <button
                                onClick={() => {
                                    if (skipsRemaining > 0 && onPass) {
                                        setShowMinusOne(true)
                                        setTimeout(
                                            () => setShowMinusOne(false),
                                            1000
                                        )
                                        onPass()
                                    }
                                }}
                                className={`relative flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-transform md:text-sm ${
                                    skipsRemaining === 0
                                        ? 'cursor-not-allowed bg-gray-200 text-gray-500'
                                        : 'cursor-pointer bg-white text-black hover:scale-105 hover:bg-gray-100 active:scale-95'
                                }`}
                                style={{ border: '1px solid #00000012' }}
                                disabled={skipsRemaining === 0}
                            >
                                <SkipButton />
                                SKIP (
                                {skipsRemaining === 0 ? 0 : skipsRemaining})
                            </button>
                            {showMinusOne && (
                                <div
                                    className='pointer-events-none absolute top-0 right-1/2 translate-x-1/2 text-2xl font-bold text-red-500'
                                    style={{
                                        animation:
                                            'float-up 1s ease-out forwards',
                                    }}
                                >
                                    -1
                                </div>
                            )}
                        </div>
                    </>
                )}

                {showStreakPopup &&
                    streakMilestone &&
                    onStreakPopupComplete && (
                        <StreakPopup
                            streak={streakMilestone}
                            onComplete={onStreakPopupComplete}
                        />
                    )}

                <div className='pointer-events-none absolute inset-0 z-[200] mb-4 flex items-end justify-center px-4 md:px-10'>
                    <div className='flex h-12 w-full items-center justify-evenly rounded-md bg-black'>
                        <h1 className='text-xl font-bold text-white uppercase'>
                            Guess {6 - remainingGuesses}/6
                        </h1>
                        <div className='flex gap-2.5'>
                            {guesses.map((guess, index) => (
                                <div
                                    key={index}
                                    className={`h-4 w-4 rounded-full ${
                                        guess === 'correct'
                                            ? 'bg-green-400'
                                            : guess === 'incorrect'
                                              ? 'bg-red-400/75'
                                              : 'bg-white'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Game Over Modal */}
                {showGameOver && onPlayAgain && (
                    <GameOverModal
                        isOpen={showGameOver}
                        highestStreak={highestStreak}
                        onPlayAgain={onPlayAgain}
                    />
                )}
            </div>
        </div>
    )
}

function HintButton() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 24 24'
        >
            <g fill='none'>
                <path
                    stroke='currentColor'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    d='m3 3l18 18'
                />
                <path
                    fill='currentColor'
                    fillRule='evenodd'
                    d='M5.4 6.23c-.44.33-.843.678-1.21 1.032a15.1 15.1 0 0 0-3.001 4.11a1.44 1.44 0 0 0 0 1.255a15.1 15.1 0 0 0 3 4.111C5.94 18.423 8.518 20 12 20c2.236 0 4.1-.65 5.61-1.562l-3.944-3.943a3 3 0 0 1-4.161-4.161L5.401 6.229zm15.266 9.608a15 15 0 0 0 2.145-3.21a1.44 1.44 0 0 0 0-1.255a15.1 15.1 0 0 0-3-4.111C18.06 5.577 15.483 4 12 4a10.8 10.8 0 0 0-2.808.363z'
                    clipRule='evenodd'
                />
            </g>
        </svg>
    )
}

function SkipButton() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='16'
            height='16'
            viewBox='0 0 512 512'
        >
            <path d='M64 64v384l277.3-192L64 64z' fill='currentColor' />
            <path d='M384 64h64v384h-64z' fill='currentColor' />
        </svg>
    )
}
