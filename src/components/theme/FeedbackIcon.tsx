'use client'

import { useColorblind } from '@/components/theme/ColorblindProvider'
import { feedbackPalette } from '@/lib/feedbackPalette'

export type FeedbackMark = 'correct' | 'partial' | 'wrong'

export function GuessDot({ guess }: { guess: 'correct' | 'incorrect' | 'empty' }) {
    const { colorblind } = useColorblind()
    const palette = feedbackPalette(colorblind)
    const mark = guess === 'correct' ? 'correct' : guess === 'incorrect' ? 'wrong' : null
    return (
        <div
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full md:h-4 md:w-4 ${
                guess === 'correct'
                    ? `${palette.dotCorrect} text-white`
                    : guess === 'incorrect'
                      ? `${palette.dotWrong} ${colorblind ? 'text-zinc-900' : 'text-white'}`
                      : 'bg-white'
            }`}
            aria-label={guess === 'correct' ? 'Correct' : guess === 'incorrect' ? 'Incorrect' : 'Not guessed'}
        >
            {mark && <FeedbackIcon mark={mark} className='h-2.5 w-2.5' />}
        </div>
    )
}

export default function FeedbackIcon({
    mark,
    className = 'h-4 w-4',
}: {
    mark: FeedbackMark
    className?: string
}) {
    if (mark === 'correct') {
        return (
            <svg viewBox='0 0 16 16' aria-hidden className={className} fill='none'>
                <path
                    d='M3.2 8.2 6.4 11.4 12.8 4.6'
                    stroke='currentColor'
                    strokeWidth='2.2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                />
            </svg>
        )
    }
    if (mark === 'wrong') {
        return (
            <svg viewBox='0 0 16 16' aria-hidden className={className} fill='none'>
                <path
                    d='M4 4 12 12M12 4 4 12'
                    stroke='currentColor'
                    strokeWidth='2.2'
                    strokeLinecap='round'
                />
            </svg>
        )
    }
    return (
        <svg viewBox='0 0 16 16' aria-hidden className={className}>
            <circle cx='8' cy='8' r='5.2' fill='none' stroke='currentColor' strokeWidth='1.8' />
            <path d='M8 2.8 A5.2 5.2 0 0 0 8 13.2 Z' fill='currentColor' />
        </svg>
    )
}
