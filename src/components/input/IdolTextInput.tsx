'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import idolNames from '@/data/idolNames.json'

const LISTBOX_ID = 'idol-guess-suggestions'

interface IdolTextInputProps {
    onSubmit: (guess: string) => void
    disabled?: boolean
    busy?: boolean
    className?: string
    isAnimating?: boolean
    notInList?: boolean
    gameWon?: boolean
    gameLost?: boolean
    correctAnswer?: string
    revealOnWin?: boolean
}

export default function IdolTextInput({
    onSubmit,
    disabled = false,
    busy = false,
    className = '',
    isAnimating = false,
    notInList = false,
    gameWon = false,
    gameLost = false,
    correctAnswer = '',
    revealOnWin = false,
}: IdolTextInputProps) {
    const [value, setValue] = useState('')
    const [open, setOpen] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [showIncorrect, setShowIncorrect] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)
    const wasAnimatingRef = useRef(false)
    const incorrectTimerRef = useRef<number | null>(null)
    const restoreFocusRef = useRef(false)
    const lastSubmittedRef = useRef('')

    const suggestions = useMemo(() => {
        const query = value.trim().toUpperCase()
        if (!query) return []
        const matches = new Set<string>()
        for (const name of idolNames as string[]) {
            const upper = name.toUpperCase()
            if (upper.includes(query)) matches.add(name)
        }
        return [...matches].sort((a, b) => a.localeCompare(b))
    }, [value])

    useEffect(() => {
        setActiveIndex(-1)
    }, [value])

    useEffect(() => {
        const list = listRef.current
        if (!list || activeIndex < 0) return
        const item = list.children[activeIndex] as HTMLElement | undefined
        if (!item) return
        const top = item.offsetTop
        const bottom = top + item.offsetHeight
        if (top < list.scrollTop) list.scrollTop = top
        else if (bottom > list.scrollTop + list.clientHeight) {
            list.scrollTop = bottom - list.clientHeight
        }
    }, [activeIndex])

    const selectSuggestion = (name: string) => {
        setValue(name)
        setOpen(false)
        setActiveIndex(-1)
        inputRef.current?.focus()
    }

    const submit = (guess: string) => {
        const trimmed = guess.trim()
        if (!trimmed || disabled || busy) return
        lastSubmittedRef.current = trimmed
        onSubmit(trimmed)
        // Keep the typed name on a wrong guess so the player can edit it
        // with backspace (matches the keyboard's behavior). A correct guess
        // in unlimited/challenge keeps it too, until the next idol starts.
        setOpen(false)
        setActiveIndex(-1)
    }

    const showingCorrect = revealOnWin && gameWon

    // Clear the text when the round is lost, or when a mode that does not
    // hold the answer is won. A held win keeps the name that was submitted.
    useEffect(() => {
        if (gameLost || (gameWon && !revealOnWin)) setValue('')
    }, [gameWon, gameLost, revealOnWin])

    useLayoutEffect(() => {
        if (showingCorrect) return
        setValue('')
        lastSubmittedRef.current = ''
    }, [correctAnswer, showingCorrect])

    useEffect(() => {
        if (!restoreFocusRef.current) return
        if (!disabled && !gameWon && !gameLost) {
            inputRef.current?.focus()
        }
    }, [disabled, gameWon, gameLost, correctAnswer])

    useEffect(() => {
        const started = isAnimating && !wasAnimatingRef.current
        wasAnimatingRef.current = isAnimating
        if (!started || notInList || gameWon || gameLost) return

        setShowIncorrect(true)
        setOpen(false)
        if (incorrectTimerRef.current !== null) {
            window.clearTimeout(incorrectTimerRef.current)
        }
        incorrectTimerRef.current = window.setTimeout(() => {
            setShowIncorrect(false)
            incorrectTimerRef.current = null
        }, 1000)
    }, [isAnimating, notInList, gameWon, gameLost])

    useEffect(() => {
        return () => {
            if (incorrectTimerRef.current !== null) {
                window.clearTimeout(incorrectTimerRef.current)
            }
        }
    }, [])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            if (suggestions.length === 0) return
            setOpen(true)
            setActiveIndex((i) => (i + 1) % suggestions.length)
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            if (suggestions.length === 0) return
            setOpen(true)
            setActiveIndex((i) =>
                i <= 0 ? suggestions.length - 1 : i - 1
            )
        } else if (e.key === 'Enter') {
            e.preventDefault()
            if (notInList || showIncorrect) return
            if (open && activeIndex >= 0 && suggestions[activeIndex]) {
                submit(suggestions[activeIndex])
            } else {
                submit(value)
            }
        } else if (e.key === 'Escape') {
            setOpen(false)
        }
    }

    const feedback = notInList
        ? 'NOT IN IDOL LIST'
        : showIncorrect
          ? 'INCORRECT'
          : ''
    const winName = (
        lastSubmittedRef.current ||
        value ||
        correctAnswer
    ).trim()

    const borderClass = showingCorrect
        ? 'border-green-400'
        : feedback
          ? 'border-red-400'
          : 'border-gray-300 dark:border-zinc-600'
    const bgClass = showingCorrect
        ? 'bg-green-400'
        : feedback
          ? 'bg-red-400'
          : 'bg-gray-200 dark:bg-zinc-800'

    return (
        <div className={`relative w-full flex-shrink-0 ${className}`}>
            <div
                className={`flex items-center rounded-md border-2 transition-colors ${bgClass} ${borderClass} ${
                    isAnimating && !gameWon ? 'shake-animation' : ''
                }`}
            >
                <input
                    ref={inputRef}
                    type='text'
                    inputMode='text'
                    autoComplete='off'
                    autoCorrect='off'
                    autoCapitalize='characters'
                    spellCheck={false}
                    value={
                        showingCorrect ? winName : feedback || value
                    }
                    readOnly={!!feedback || showingCorrect}
                    disabled={disabled}
                    placeholder="WHAT'S YOUR GUESS?"
                    onChange={(e) => {
                        if (feedback || showingCorrect) return
                        setValue(e.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => {
                        restoreFocusRef.current = true
                        if (!feedback && !showingCorrect) setOpen(true)
                    }}
                    onBlur={() => setOpen(false)}
                    onKeyDown={handleKeyDown}
                    role='combobox'
                    aria-controls={LISTBOX_ID}
                    aria-expanded={open && suggestions.length > 0}
                    aria-autocomplete='list'
                    className={`w-full bg-transparent px-4 py-3 text-lg font-bold tracking-wider uppercase outline-none ${
                        showingCorrect
                            ? 'text-white disabled:opacity-100'
                            : feedback
                              ? 'text-white placeholder:text-white/70 disabled:opacity-50'
                              : 'text-black placeholder:text-black/30 disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-100/30'
                    }`}
                />
                {!showingCorrect && (
                    <button
                        type='button'
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => submit(value)}
                        disabled={disabled || busy || !!feedback || !value.trim()}
                        tabIndex={-1}
                        className='mr-2 rounded-full bg-pink-600 px-3 py-2 text-lg font-bold text-white transition-colors hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-40'
                    >
                        GUESS
                    </button>
                )}
            </div>

            {open && !feedback && !showingCorrect && suggestions.length > 0 && (
                <ul
                    ref={listRef}
                    id={LISTBOX_ID}
                    role='listbox'
                    className='absolute bottom-full left-0 z-[250] mb-2 max-h-60 w-full touch-pan-y overflow-y-auto overscroll-contain rounded-md border border-gray-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900'
                >
                    {suggestions.map((name, index) => (
                        <li
                            key={`${name}-${index}`}
                            role='option'
                            aria-selected={index === activeIndex}
                            onMouseDown={(e) => {
                                e.preventDefault()
                                selectSuggestion(name)
                            }}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`cursor-pointer px-4 py-2.5 text-base font-semibold uppercase text-black dark:text-zinc-100 ${
                                index === activeIndex
                                    ? 'bg-gray-200 dark:bg-zinc-700'
                                    : ''
                            }`}
                        >
                            {name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
