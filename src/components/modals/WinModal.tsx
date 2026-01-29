'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import localFont from 'next/font/local'
import ShareButton from '@/components/ShareButton'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

interface WinModalProps {
    isOpen: boolean
    onClose: () => void
    idolName: string
    imageUrl: string
    pixelatedImageUrl: string
    guessCount: number
    isWin: boolean
    guessAttempts: string[]
    stats: {
        gamesPlayed: number
        winPercentage: number
        currentStreak: number
        maxStreak: number
    }
    guessDistribution: number[]
    gameMode?: 'daily' | 'unlimited' | 'hangul'
    onNextUnlimited?: () => void
    isHistoryMode?: boolean
    historyDate?: string
}

export default function WinModal({
    isOpen,
    onClose,
    idolName,
    imageUrl,
    pixelatedImageUrl,
    guessCount,
    isWin,
    guessAttempts,
    stats,
    guessDistribution,
    gameMode = 'daily',
    onNextUnlimited,
    isHistoryMode = false,
    historyDate,
}: WinModalProps) {
    const formatHistoryDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
        })
    }
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen) return null

    const maxGuessCount = Math.max(...guessDistribution, 1)

    return (
        <div className='hide-scrollbar fixed inset-0 z-[300] flex items-start justify-center overflow-y-auto bg-black/50'>
            <div
                className={`win-modal-slide relative w-full max-w-md bg-white shadow-xl sm:my-8 sm:rounded-2xl ${isOpen ? 'win-modal-slide-in' : ''}`}
            >
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                    aria-label='Close'
                >
                    <svg
                        className='h-4 w-4 text-gray-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                        />
                    </svg>
                </button>

                <div className='flex flex-col items-center p-6'>
                    {isHistoryMode && historyDate && (
                        <div className='mt-4 mb-2 rounded-full bg-pink-100 px-3 py-1'>
                            <span className='text-sm font-medium text-pink-600'>
                                {formatHistoryDate(historyDate)}
                            </span>
                        </div>
                    )}
                    <h1
                        className={`${proximaNovaBold.className} ${isHistoryMode ? 'mt-2' : 'mt-8'} mb-1 text-3xl font-extrabold text-black`}
                    >
                        {isWin ? 'GOOD JOB!' : 'NICE TRY!'}
                    </h1>
                    <p className='mb-6 text-base text-gray-700'>
                        {isWin ? (
                            <>
                                You guessed{' '}
                                <span className='stroke-black stroke-1 font-bold text-green-400'>
                                    {idolName}
                                </span>{' '}
                                in {guessCount}{' '}
                                {guessCount === 1 ? 'guess' : 'guesses'}!
                            </>
                        ) : (
                            <>
                                You failed to guess{' '}
                                <span className='font-bold text-red-500'>
                                    {idolName}
                                </span>
                            </>
                        )}
                    </p>

                    <div className='mb-4 w-full overflow-hidden'>
                        <div className='relative aspect-square w-full'>
                            <Image
                                src={imageUrl}
                                alt={idolName}
                                fill
                                className='object-cover'
                                sizes='(max-width: 448px) 100vw, 448px'
                            />
                        </div>
                    </div>

                    {gameMode === 'daily' && !isHistoryMode ? (
                        <ShareButton
                            correctAnswer={idolName}
                            guessCount={guessCount}
                            pixelatedImageSrc={pixelatedImageUrl}
                            isWin={isWin}
                            className='mb-4'
                        />
                    ) : isHistoryMode ? (
                       <>
                       </>
                    ) : (
                        <button
                            onClick={() => {
                                onClose()
                                onNextUnlimited?.()
                            }}
                            className='mb-4 w-full cursor-pointer rounded-lg bg-green-400 py-3 text-base font-bold text-white transition-colors hover:bg-green-400/60'
                        >
                            NEXT IDOL
                        </button>
                    )}

                    {gameMode === 'daily' && guessAttempts.length > 0 && (
                        <div className='mb-4 w-full'>
                            <div className='space-y-2'>
                                {guessAttempts.map((attempt, index) => {
                                    const isCorrectGuess =
                                        attempt.toUpperCase() ===
                                        idolName.toUpperCase()
                                    return (
                                        <div
                                            key={index}
                                            className={`flex items-center justify-between rounded-lg px-4 py-3 ${isCorrectGuess ? 'border border-green-200 bg-green-50' : 'border border-red-200 bg-red-50'}`}
                                        >
                                            <div className='flex items-center gap-3'>
                                                <span className='text-sm font-bold text-gray-500'>
                                                    {index + 1}
                                                </span>
                                                <span
                                                    className={`${proximaNovaBold.className} font-bold ${isCorrectGuess ? 'text-green-600' : 'text-red-400'}`}
                                                >
                                                    {attempt}
                                                </span>
                                            </div>
                                            {isCorrectGuess ? (
                                                <span className='text-green-500'>
                                                    ✓
                                                </span>
                                            ) : (
                                                <span className='text-red-400'>
                                                    ✕
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {gameMode === 'daily' && !isHistoryMode && (
                        <>
                            <div className='mb-8 w-full border-t border-gray-200' />
                            <div className='mb-8 w-full'>
                                <h2
                                    className={`${proximaNovaBold.className} mb-4 text-center text-2xl font-bold text-black`}
                                >
                                    STATISTICS
                                </h2>
                                <div className='mb-3 grid grid-cols-4 gap-4 text-center'>
                                    <div>
                                        <div className='mb-2.5 text-3xl font-bold text-black'>
                                            {stats.gamesPlayed}
                                        </div>
                                        <div className='text-sm leading-none text-gray-500'>
                                            Played
                                        </div>
                                    </div>
                                    <div>
                                        <div className='mb-2.5 text-3xl font-bold text-black'>
                                            {stats.winPercentage}%
                                        </div>
                                        <div className='text-sm leading-none text-gray-500'>
                                            Win %
                                        </div>
                                    </div>
                                    <div>
                                        <div className='mb-2.5 text-3xl font-bold text-black'>
                                            {stats.currentStreak}
                                        </div>
                                        <div className='text-sm leading-none text-gray-500'>
                                            Current streak
                                        </div>
                                    </div>
                                    <div>
                                        <div className='mb-2.5 text-3xl font-bold text-black'>
                                            {stats.maxStreak}
                                        </div>
                                        <div className='text-sm leading-none text-gray-500'>
                                            Max streak
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className='w-full'>
                                <h2
                                    className={`${proximaNovaBold.className} mb-4 text-center text-2xl font-bold text-black`}
                                >
                                    GUESS DISTRIBUTION
                                </h2>
                                <div className='space-y-2'>
                                    {guessDistribution.map((count, index) => {
                                        const percentage =
                                            maxGuessCount > 0
                                                ? (count / maxGuessCount) * 100
                                                : 0
                                        return (
                                            <div
                                                key={index}
                                                className='flex items-center gap-2'
                                            >
                                                <div className='w-4 text-sm font-medium text-black'>
                                                    {index + 1}
                                                </div>
                                                <div className='relative h-8 flex-1 overflow-hidden rounded-full bg-gray-200'>
                                                    <div
                                                        className='flex h-full items-center justify-end bg-green-400 px-2 text-sm font-bold text-white transition-all duration-500'
                                                        style={{
                                                            width: `${Math.max(percentage, count > 0 ? 15 : 0)}%`,
                                                        }}
                                                    >
                                                        {count > 0 && count}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
