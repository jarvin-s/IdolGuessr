'use client'

import { useEffect, useState } from 'react'
import IdolTextInput from '@/components/input/IdolTextInput'
import idolNames from '@/data/idolNames.json'

const NAMES = new Set((idolNames as string[]).map((name) => name.toUpperCase()))

export default function DuelGuessInput({
    onSubmit,
    disabled,
    guessesLeft,
    maxGuesses,
    done,
    correct,
    used,
}: {
    onSubmit: (guess: string) => Promise<{ correct: boolean } | void>
    disabled: boolean
    guessesLeft: number
    maxGuesses: number
    done: boolean
    correct: boolean
    used: number
}) {
    const [notInList, setNotInList] = useState(false)
    const [busy, setBusy] = useState(false)
    const [flash, setFlash] = useState(false)

    useEffect(() => {
        if (!notInList && !flash) return
        const timer = window.setTimeout(() => {
            setNotInList(false)
            setFlash(false)
        }, 1000)
        return () => window.clearTimeout(timer)
    }, [notInList, flash])

    const submit = async (guess: string) => {
        if (done || disabled || busy) return
        if (!NAMES.has(guess.trim().toUpperCase())) {
            setNotInList(true)
            return
        }
        setBusy(true)
        try {
            const result = await onSubmit(guess)
            if (result && result.correct === false) setFlash(true)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className='w-full'>
            {done ? (
                <p className='py-3 text-center text-sm font-medium text-zinc-500'>
                    {correct ? 'You got it.' : 'No guesses left.'} Waiting for others...
                </p>
            ) : (
                <IdolTextInput
                    onSubmit={(guess) => void submit(guess)}
                    disabled={disabled || busy}
                    busy={busy}
                    notInList={notInList}
                    isAnimating={flash}
                />
            )}
            <div className='mt-2 flex justify-center gap-2' aria-label={`${guessesLeft} guesses left`}>
                {Array.from({ length: maxGuesses }, (_, index) => {
                    const filled = index < used
                    const isCorrect = correct && index === used - 1
                    return (
                        <span
                            key={index}
                            className={`h-3 w-3 rounded-full ${
                                !filled
                                    ? 'bg-zinc-300 dark:bg-zinc-700'
                                    : isCorrect
                                      ? 'bg-emerald-500'
                                      : 'bg-red-500'
                            }`}
                        />
                    )
                })}
            </div>
        </div>
    )
}
