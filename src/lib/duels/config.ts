import { INFINITE_GEN_VALUES } from '@/utils/genFilter'
import {
    isImageMode,
    isInfiniteDifficulty,
    type ImageMode,
    type InfiniteDifficulty,
} from '@/utils/difficulty'
import type { DuelConfig, DuelGameMode, DuelGroup } from '@/lib/duels/types'

export const DUEL_CONFIG_KEY = 'idol-guessr-duel-config'

export const DEFAULT_DUEL_CONFIG: DuelConfig = {
    game_mode: 'visual',
    image_mode: 'pixelated',
    difficulty: 'normal',
    group: 'both',
    gens: [...INFINITE_GEN_VALUES],
}

function isGroup(value: unknown): value is DuelGroup {
    return value === 'boy-group' || value === 'girl-group' || value === 'both'
}

function isGameMode(value: unknown): value is DuelGameMode {
    return value === 'visual' || value === 'classic' || value === 'unshuffled'
}

export function normalizeDuelConfig(value: unknown): DuelConfig {
    const raw = (value ?? {}) as Partial<DuelConfig>
    const allowed = INFINITE_GEN_VALUES as readonly number[]
    const gens = Array.isArray(raw.gens)
        ? [...new Set(raw.gens.filter((gen): gen is number => typeof gen === 'number' && allowed.includes(gen)))].sort(
              (a, b) => a - b
          )
        : []
    return {
        game_mode: isGameMode(raw.game_mode) ? raw.game_mode : 'visual',
        image_mode: isImageMode(raw.image_mode) ? raw.image_mode : 'pixelated',
        difficulty: isInfiniteDifficulty(raw.difficulty) ? raw.difficulty : 'normal',
        group: isGroup(raw.group) ? raw.group : 'both',
        gens: gens.length > 0 ? gens : [...INFINITE_GEN_VALUES],
    }
}

export function loadDuelConfig(): DuelConfig {
    if (typeof window === 'undefined') return DEFAULT_DUEL_CONFIG
    try {
        const saved = window.localStorage.getItem(DUEL_CONFIG_KEY)
        if (!saved) return DEFAULT_DUEL_CONFIG
        return normalizeDuelConfig(JSON.parse(saved))
    } catch {
        return DEFAULT_DUEL_CONFIG
    }
}

export function saveDuelConfig(config: DuelConfig): void {
    const next = normalizeDuelConfig(config)
    window.localStorage.setItem(DUEL_CONFIG_KEY, JSON.stringify(next))
}

export function duelConfigSummary(config: DuelConfig): string {
    const gens = config.gens.map((gen) => `Gen ${gen}`).join(', ')
    const group =
        config.group === 'both'
            ? 'Both groups'
            : config.group === 'boy-group'
              ? 'Boy groups'
              : 'Girl groups'
    const image = config.image_mode === 'zoom' ? 'Zoomed' : 'Pixelated'
    return `${group} · ${image} · ${gens} · ${config.difficulty}`
}

export type { ImageMode, InfiniteDifficulty }
