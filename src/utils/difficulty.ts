export type InfiniteDifficulty = 'easy' | 'normal' | 'hard' | 'challenger'

export const DIFFICULTY_STORAGE_KEY = 'idol-guessr-difficulty'

export const DIFFICULTIES: InfiniteDifficulty[] = [
    'easy',
    'normal',
    'hard',
    'challenger',
]

export const DIFFICULTY_LABELS: Record<InfiniteDifficulty, string> = {
    easy: 'Easy',
    normal: 'Normal',
    hard: 'Hard',
    challenger: 'Challenger',
}

export const DIFFICULTY_DESCRIPTIONS: Record<InfiniteDifficulty, string> = {
    easy: '6 guesses, 3 hints, 3 skips',
    normal: '6 guesses, 1 hint, 1 skip',
    hard: '6 guesses, no hints or skips',
    challenger: '3 guesses, no hints or skips',
}

export interface DifficultyConfig {
    maxGuesses: number
    hints: number
    skips: number
}

export function getDifficultyConfig(
    difficulty: InfiniteDifficulty
): DifficultyConfig {
    return {
        maxGuesses: difficulty === 'challenger' ? 3 : 6,
        hints: difficulty === 'easy' ? 3 : difficulty === 'normal' ? 1 : 0,
        skips: difficulty === 'easy' ? 3 : difficulty === 'normal' ? 1 : 0,
    }
}

export function emptyGuesses(
    count: number
): Array<'correct' | 'incorrect' | 'empty'> {
    return Array.from({ length: count }, () => 'empty')
}

export function isInfiniteDifficulty(
    value: unknown
): value is InfiniteDifficulty {
    return (
        value === 'easy' ||
        value === 'normal' ||
        value === 'hard' ||
        value === 'challenger'
    )
}

export function loadSavedDifficulty(): InfiniteDifficulty {
    if (typeof window === 'undefined') return 'normal'
    try {
        const saved = localStorage.getItem(DIFFICULTY_STORAGE_KEY)
        if (isInfiniteDifficulty(saved)) return saved
    } catch {
        // Ignore storage errors
    }
    return 'normal'
}

export function saveDifficulty(difficulty: InfiniteDifficulty): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(DIFFICULTY_STORAGE_KEY, difficulty)
    } catch {
        // Ignore storage errors
    }
}
