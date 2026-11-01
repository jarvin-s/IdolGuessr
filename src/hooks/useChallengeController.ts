'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getChallenge,
  submitChallengeResult,
  checkChallengePlayed,
  startChallengeAttempt,
  getOrCreateSessionId,
  getImageUrl,
  supabase,
  type Challenge,
  type ChallengeIdol,
  type ChallengeIdolResult,
} from '@/lib/supabase'
import idolNames from '@/data/idolNames.json'

const idolNamesSet = new Set(idolNames.map((name: string) => name.toUpperCase()))

const CHALLENGE_STORAGE_KEY = 'idol-guessr-challenge-progress'

interface ChallengeProgress {
  challengeId: string
  currentIndex: number
  results: ChallengeIdolResult[]
  currentGuesses: Array<'correct' | 'incorrect' | 'empty'>
}

export function useChallengeController(challengeId: string) {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentGuess, setCurrentGuess] = useState('')
  const [lastIncorrectGuess, setLastIncorrectGuess] = useState('')
  const [guesses, setGuesses] = useState<Array<'correct' | 'incorrect' | 'empty'>>([
    'empty', 'empty', 'empty', 'empty', 'empty', 'empty'
  ])
  const [isAnimating, setIsAnimating] = useState(false)
  const [gameWon, setGameWon] = useState(false)
  const [gameLost, setGameLost] = useState(false)
  const [notInList, setNotInList] = useState(false)

  const [results, setResults] = useState<ChallengeIdolResult[]>([])
  const [attemptStarted, setAttemptStarted] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 })

  const sessionId = useRef<string>('')
  const hasLoadedRef = useRef(false)

  const currentIdol: ChallengeIdol | null = challenge?.idols?.[currentIndex] ?? null
  const correctAnswer = currentIdol?.name?.toUpperCase() ?? ''
  const remainingGuesses = guesses.filter((g) => g === 'empty').length
  const totalIdols = challenge?.idol_count ?? 0
  const totalCorrect = results.filter((r) => r.correct).length

  const saveProgress = useCallback((
    _index: number,
    _currentResults: ChallengeIdolResult[],
    _currentGuessState: Array<'correct' | 'incorrect' | 'empty'>
  ) => {
    // submit_challenge_guess stores the in-progress challenge.
  }, [])

  const clearProgress = useCallback(() => {
    // The finished challenge stays on the server.
  }, [])

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true

    const loadChallenge = async () => {
      setIsLoading(true)
      sessionId.current = getOrCreateSessionId()

      const played = await checkChallengePlayed(challengeId, sessionId.current)
      if (played) {
        setAlreadyPlayed(true)
        setIsLoading(false)
        return
      }

      const challengeData = await getChallenge(challengeId)
      if (!challengeData) {
        setError('Challenge not found or has expired')
        setIsLoading(false)
        return
      }

      setChallenge(challengeData)

      const { data } = await supabase.rpc('get_challenge_progress', {
        p_challenge_id: challengeId,
      })
      const saved = data as {
        index?: number
        results?: ChallengeIdolResult[]
        current_guesses?: string[]
        started?: boolean
      } | null
      if (saved && typeof saved.index === 'number') {
        setCurrentIndex(saved.index)
        setResults(saved.results ?? [])
        const slots: Array<'correct' | 'incorrect' | 'empty'> = [
          'empty', 'empty', 'empty', 'empty', 'empty', 'empty',
        ]
        ;(saved.current_guesses ?? []).forEach((_, index) => {
          if (index < 6) slots[index] = 'incorrect'
        })
        setGuesses(slots)
        setAttemptStarted(
          Boolean(saved.started) ||
            saved.index > 0 ||
            (saved.results?.length ?? 0) > 0 ||
            (saved.current_guesses?.length ?? 0) > 0,
        )
      }

      setIsLoading(false)
    }

    void loadChallenge()
  }, [challengeId])

  useEffect(() => {
    const update = () => setWindowDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const moveToNextIdol = useCallback(() => {
    if (!challenge) return

    const nextIndex = currentIndex + 1
    if (nextIndex >= challenge.idol_count) {
      setIsComplete(true)
      clearProgress()
    } else {
      setCurrentIndex(nextIndex)
      setCurrentGuess('')
      setLastIncorrectGuess('')
      setGuesses(['empty', 'empty', 'empty', 'empty', 'empty', 'empty'])
      setGameWon(false)
      setGameLost(false)
      setIsAnimating(false)
      saveProgress(nextIndex, results, ['empty', 'empty', 'empty', 'empty', 'empty', 'empty'])
    }
  }, [challenge, currentIndex, results, saveProgress, clearProgress])

  const recordResult = useCallback((correct: boolean, guessCount: number, guessAttempts: string[]) => {
    if (!currentIdol) return

    const result: ChallengeIdolResult = {
      idol_id: currentIdol.id,
      correct,
      guess_count: guessCount,
      guesses: guessAttempts
    }

    setResults((prev) => {
      const newResults = [...prev, result]
      saveProgress(currentIndex, newResults, guesses)
      return newResults
    })
  }, [currentIdol, currentIndex, guesses, saveProgress])

  const markStarted = useCallback(async () => {
    const ok = await startChallengeAttempt(challengeId)
    if (ok) setAttemptStarted(true)
    return ok
  }, [challengeId])

  const submitResults = useCallback(async (nickname: string | null) => {
    if (!challenge || isSubmitting) return false

    setIsSubmitting(true)
    const finalCorrect = results.filter((r) => r.correct).length

    const resultId = await submitChallengeResult(
      challengeId,
      sessionId.current,
      nickname,
      results,
      finalCorrect
    )

    setIsSubmitting(false)
    clearProgress()

    return resultId !== null
  }, [challenge, challengeId, results, isSubmitting, clearProgress])

  const guessAttemptsRef = useRef<string[]>([])
  const challengeGuessLock = useRef(false)

  const handleKeyPress = useCallback((key: string, guessOverride?: string) => {
    if (isComplete || !currentIdol) return

    if (key === 'ENTER') {
      const activeGuess = guessOverride ?? currentGuess
      if (
        activeGuess.trim() &&
        guesses.some((g) => g === 'empty') &&
        !isAnimating &&
        !gameWon &&
        !gameLost
      ) {
        const normalizedGuess = activeGuess.toUpperCase().trim()

        if (!idolNamesSet.has(normalizedGuess)) {
          setNotInList(true)
          setIsAnimating(true)
          setTimeout(() => {
            setIsAnimating(false)
            setTimeout(() => setNotInList(false), 1000)
          }, 500)
          return
        }

        guessAttemptsRef.current.push(normalizedGuess)
        if (challengeGuessLock.current) return
        challengeGuessLock.current = true
        void (async () => {
          try {
        const { data, error } = await supabase.rpc('submit_challenge_guess', {
          p_challenge_id: challengeId,
          p_index: currentIndex,
          p_guess: normalizedGuess,
        })
        if (error || !data) return
        const isCorrect = Boolean((data as { correct?: boolean }).correct)
        const answer = String((data as { answer?: string }).answer || '')
        if (answer) currentIdol.name = answer

        setIsAnimating(true)

        if (!isCorrect) {
          setLastIncorrectGuess(normalizedGuess)
          setCurrentGuess('')

          setTimeout(() => {
            setIsAnimating(false)
            setLastIncorrectGuess('')
            setGuesses((prev) => {
              const newGuesses = [...prev]
              const emptyIndex = newGuesses.findIndex((g) => g === 'empty')
              if (emptyIndex === -1) return prev
              newGuesses[emptyIndex] = 'incorrect'

              const remainingAfterThis = newGuesses.filter((g) => g === 'empty').length
              if (remainingAfterThis === 0) {
                setTimeout(() => {
                  setGameLost(true)
                  recordResult(false, 6, guessAttemptsRef.current)
                  guessAttemptsRef.current = []
                  setTimeout(() => moveToNextIdol(), 2000)
                }, 300)
              } else {
                saveProgress(currentIndex, results, newGuesses)
              }

              return newGuesses
            })
          }, 500)
        } else {
          const emptyIndex = guesses.findIndex((g) => g === 'empty')
          const guessNumber = 6 - remainingGuesses + 1

          setGameWon(true)
          setIsAnimating(false)
          setCurrentGuess('')
          setGuesses((prev) => {
            const newGuesses = [...prev]
            if (emptyIndex === -1) return prev
            newGuesses[emptyIndex] = 'correct'
            return newGuesses
          })

          recordResult(true, guessNumber, guessAttemptsRef.current)
          guessAttemptsRef.current = []

          setTimeout(() => moveToNextIdol(), 2000)
        }
          } finally {
            challengeGuessLock.current = false
          }
        })()
      }
    } else if (key === '✕') {
      if (!gameWon && !gameLost) {
        setCurrentGuess((prev) => prev.slice(0, -1))
      }
    } else {
      if (
        guesses.some((g) => g === 'empty') &&
        !isAnimating &&
        !gameWon &&
        !gameLost &&
        currentGuess.length < 20
      ) {
        if (lastIncorrectGuess) setLastIncorrectGuess('')
        setCurrentGuess((prev) => prev + key)
      }
    }
  }, [
    currentGuess,
    guesses,
    isAnimating,
    gameWon,
    gameLost,
    remainingGuesses,
    currentIdol,
    isComplete,
    lastIncorrectGuess,
    recordResult,
    moveToNextIdol,
    saveProgress,
    currentIndex,
    results
  ])

  useEffect(() => {
    const handlePhysicalKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return
      }
      const key = event.key.toUpperCase()
      if (key === 'ENTER' || key === 'BACKSPACE' || /^[A-Z]$/.test(key)) {
        event.preventDefault()
      }
      if (key === 'ENTER') {
        handleKeyPress('ENTER')
      } else if (key === 'BACKSPACE') {
        handleKeyPress('✕')
      } else if (/^[A-Z]$/.test(key)) {
        handleKeyPress(key)
      }
    }
    window.addEventListener('keydown', handlePhysicalKeyPress)
    return () => window.removeEventListener('keydown', handlePhysicalKeyPress)
  }, [handleKeyPress])

  const getCurrentImageUrl = useCallback((guessNumber: number | 'clear') => {
    if (!currentIdol) return ''
    return getImageUrl(
      '',
      currentIdol.img_bucket,
      guessNumber,
      'unlimited',
      currentIdol.group_category,
      currentIdol.base64_group
    )
  }, [currentIdol])

  return {
    // Challenge data
    challenge,
    isLoading,
    error,
    alreadyPlayed,

    // Current game state
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

    // Results
    results,
    totalCorrect,
    isComplete,
    isSubmitting,
    attemptStarted,
    markStarted,

    // Actions
    handleKeyPress,
    submitResults,
    getCurrentImageUrl,

    // UI
    windowDimensions,
  }
}
