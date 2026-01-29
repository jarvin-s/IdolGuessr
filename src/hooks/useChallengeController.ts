'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getChallenge,
  submitChallengeResult,
  checkChallengePlayed,
  getOrCreateSessionId,
  getImageUrl,
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

  const loadProgress = useCallback((): ChallengeProgress | null => {
    if (typeof window === 'undefined') return null
    try {
      const saved = localStorage.getItem(CHALLENGE_STORAGE_KEY)
      if (!saved) return null
      const progress = JSON.parse(saved) as ChallengeProgress
      if (progress.challengeId !== challengeId) return null
      return progress
    } catch {
      return null
    }
  }, [challengeId])

  const saveProgress = useCallback((
    index: number,
    currentResults: ChallengeIdolResult[],
    currentGuessState: Array<'correct' | 'incorrect' | 'empty'>
  ) => {
    if (typeof window === 'undefined') return
    try {
      const progress: ChallengeProgress = {
        challengeId,
        currentIndex: index,
        results: currentResults,
        currentGuesses: currentGuessState
      }
      localStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(progress))
    } catch (error) {
      console.error('Error saving challenge progress:', error)
    }
  }, [challengeId])

  const clearProgress = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(CHALLENGE_STORAGE_KEY)
    } catch (error) {
      console.error('Error clearing challenge progress:', error)
    }
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

      const savedProgress = loadProgress()
      if (savedProgress) {
        setCurrentIndex(savedProgress.currentIndex)
        setResults(savedProgress.results)
        setGuesses(savedProgress.currentGuesses)
      }

      setIsLoading(false)
    }

    void loadChallenge()
  }, [challengeId, loadProgress])

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

  const handleKeyPress = useCallback((key: string) => {
    if (isComplete || !currentIdol) return

    if (key === 'ENTER') {
      if (
        currentGuess.trim() &&
        guesses.some((g) => g === 'empty') &&
        !isAnimating &&
        !gameWon &&
        !gameLost
      ) {
        const normalizedGuess = currentGuess.toUpperCase().trim()

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

        const normalizedName = currentIdol.name?.toUpperCase().trim() || ''
        const normalizedAltName = currentIdol.alt_name?.toUpperCase().trim() || ''
        let isCorrect = normalizedGuess === normalizedName
        if (normalizedAltName && !isCorrect) {
          isCorrect = normalizedGuess === normalizedAltName
        }

        setIsAnimating(true)

        if (!isCorrect) {
          setLastIncorrectGuess(normalizedGuess)
          setCurrentGuess('')

          setTimeout(() => {
            setIsAnimating(false)
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
      }
    } else if (key === '✕') {
      if (!gameWon && !gameLost) {
        if (currentGuess === '' && lastIncorrectGuess) {
          setCurrentGuess(lastIncorrectGuess.slice(0, -1))
          setLastIncorrectGuess('')
        } else {
          setCurrentGuess((prev) => prev.slice(0, -1))
        }
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

    // Actions
    handleKeyPress,
    submitResults,
    getCurrentImageUrl,

    // UI
    windowDimensions,
  }
}
