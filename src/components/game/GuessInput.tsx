'use client'

import FeedbackIcon from '@/components/theme/FeedbackIcon'
import { useColorblind } from '@/components/theme/ColorblindProvider'
import { feedbackPalette } from '@/lib/feedbackPalette'

interface GuessInputProps {
    currentGuess: string
    correctAnswer?: string
    gameWon?: boolean
    gameLost?: boolean
    lastIncorrectGuess?: string
    isAnimating?: boolean
    notInList?: boolean
}

export default function GuessInput({
    currentGuess,
    correctAnswer = '',
    gameWon = false,
    gameLost = false,
    lastIncorrectGuess = '',
    isAnimating = false,
    notInList = false,
}: GuessInputProps) {
    const { colorblind } = useColorblind()
    const palette = feedbackPalette(colorblind)

    const truncateText = (text: string, maxLength: number = 20) => {
        return text.length > maxLength ? text.slice(0, maxLength) : text
    }

    const getDisplayContent = () => {
        if (gameWon) {
            return {
                text: truncateText(correctAnswer),
                subText: '',
                textColor: 'text-white',
                bgColor: palette.bannerCorrect,
                mark: 'correct' as const,
            }
        }
        if (gameLost) {
            return {
                text: `Nice try! It was ${correctAnswer}`,
                subText: '',
                textColor: 'text-white',
                bgColor: palette.bannerWrong,
                mark: 'wrong' as const,
            }
        }
        if (notInList) {
            return {
                text: '',
                subText: 'NOT IN IDOL LIST',
                textColor: 'text-white',
                bgColor: palette.bannerWrong,
                mark: 'wrong' as const,
            }
        }
        if (lastIncorrectGuess) {
            return {
                text: 'INCORRECT',
                subText: '',
                textColor: 'text-white',
                bgColor: palette.bannerWrong,
                mark: 'wrong' as const,
            }
        }
        if (currentGuess) {
            return {
                text: truncateText(currentGuess),
                subText: '',
                textColor: 'text-black dark:text-zinc-100',
                bgColor: 'bg-gray-200 dark:bg-zinc-800',
                mark: null,
            }
        }
        return {
            text: "WHAT'S YOUR GUESS?",
            subText: '',
            textColor: 'text-black/30 dark:text-zinc-100/30',
            bgColor: 'bg-gray-200 dark:bg-zinc-800',
            mark: null,
        }
    }

    const display = getDisplayContent()

    return (
        <div
            className={`mb-3 w-full flex-shrink-0 rounded-md ${display.bgColor}`}
        >
            <div
                className={`flex flex-nowrap items-center justify-center gap-2 rounded-lg px-4 py-2 text-center font-bold tracking-wider transition-colors duration-300 ${
                    isAnimating && !gameWon ? 'shake-animation' : ''
                }`}
                style={{ minHeight: '3rem' }}
            >
                {display.mark && <FeedbackIcon mark={display.mark} className='h-5 w-5 shrink-0 text-white' />}
                <span className={`min-w-0 text-lg select-none ${gameLost ? '' : 'whitespace-nowrap'} ${display.textColor}`}>
                    {display.text || display.subText}
                </span>
            </div>
        </div>
    )
}
