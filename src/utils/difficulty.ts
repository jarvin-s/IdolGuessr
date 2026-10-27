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

export type ImageMode = 'pixelated' | 'zoom'

export const IMAGE_MODE_STORAGE_KEY = 'idol-guessr-image-mode'

export const IMAGE_MODE_LABELS: Record<ImageMode, string> = {
    pixelated: 'Pixelated',
    zoom: 'Zoom',
}

export function isImageMode(value: unknown): value is ImageMode {
    return value === 'pixelated' || value === 'zoom'
}

export function loadSavedImageMode(): ImageMode {
    if (typeof window === 'undefined') return 'pixelated'
    try {
        const saved = localStorage.getItem(IMAGE_MODE_STORAGE_KEY)
        if (isImageMode(saved)) return saved
    } catch {
        // Ignore storage errors
    }
    return 'pixelated'
}

export function saveImageMode(mode: ImageMode): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(IMAGE_MODE_STORAGE_KEY, mode)
    } catch {
        // Ignore storage errors
    }
}

// Scale applied to clear.png for each guess count. Index = guesses used.
const ZOOM_SCALES_6 = [5, 3.5, 2.5, 1.8, 1.3, 1]
const ZOOM_SCALES_3 = [4, 2.5, 1.6, 1]

export function getZoomScale(
    guessesUsed: number,
    maxGuesses: number,
    roundEnded: boolean
): number {
    if (roundEnded) return 1
    const scales = maxGuesses <= 3 ? ZOOM_SCALES_3 : ZOOM_SCALES_6
    return scales[Math.min(guessesUsed, scales.length - 1)]
}
