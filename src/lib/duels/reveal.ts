import { ROUND_SECONDS } from '@/lib/duels/constants'
import type { InfiniteDifficulty } from '@/utils/difficulty'

function frameCount(difficulty: InfiniteDifficulty): number {
    return difficulty === 'challenger' ? 3 : 6
}

function frameMs(difficulty: InfiniteDifficulty): number {
    return (ROUND_SECONDS / frameCount(difficulty)) * 1000
}

export function getRevealStep(
    elapsedMs: number,
    difficulty: InfiniteDifficulty
): number {
    const count = frameCount(difficulty)
    if (elapsedMs <= 0) return 0
    return Math.min(count - 1, Math.floor(elapsedMs / frameMs(difficulty)))
}

export function getRevealFrame(
    elapsedMs: number,
    difficulty: InfiniteDifficulty
): number | 'clear' {
    const step = getRevealStep(elapsedMs, difficulty)
    if (difficulty === 'challenger') return step + 1
    if (step >= 5) return 'clear'
    return step + 1
}
