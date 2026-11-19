'use client'

import {
    DIFFICULTIES,
    DIFFICULTY_LABELS,
    IMAGE_MODE_LABELS,
    type ImageMode,
    type InfiniteDifficulty,
} from '@/utils/difficulty'
import { INFINITE_GEN_OPTIONS } from '@/utils/genFilter'
import type { DuelConfig, DuelGameMode, DuelGroup } from '@/lib/duels/types'

const GROUPS: { value: DuelGroup; label: string }[] = [
    { value: 'both', label: 'Both' },
    { value: 'boy-group', label: 'Boy groups' },
    { value: 'girl-group', label: 'Girl groups' },
]

const MODES: { value: DuelGameMode; label: string; soon?: boolean }[] = [
    { value: 'visual', label: 'Visual' },
    { value: 'classic', label: 'Classic', soon: true },
    { value: 'unshuffled', label: 'Unshuffled', soon: true },
]

const IMAGE_MODES: ImageMode[] = ['pixelated', 'zoom']

function choiceClass(selected: boolean, disabled = false) {
    return `cursor-pointer border-2 px-3 py-2 text-sm font-medium transition-colors ${
        disabled ? 'cursor-not-allowed opacity-50' : ''
    } ${
        selected
            ? 'border-pink-500 bg-pink-500 text-white'
            : 'border-gray-200 bg-white hover:border-gray-300 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-500'
    }`
}

export default function DuelConfigForm({
    value,
    onChange,
    disabled = false,
}: {
    value: DuelConfig
    onChange: (config: DuelConfig) => void
    disabled?: boolean
}) {
    const toggleGen = (gen: number) => {
        if (disabled) return
        const has = value.gens.includes(gen)
        if (has && value.gens.length === 1) return
        const gens = has
            ? value.gens.filter((item) => item !== gen)
            : [...value.gens, gen].sort((a, b) => a - b)
        onChange({ ...value, gens })
    }

    return (
        <div className='space-y-4 text-left'>
            <div>
                <p className='mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300'>Game mode</p>
                <div className='grid grid-cols-3 gap-2'>
                    {MODES.map((mode) => (
                        <button
                            key={mode.value}
                            type='button'
                            disabled={disabled || mode.soon}
                            onClick={() => onChange({ ...value, game_mode: mode.value })}
                            className={choiceClass(value.game_mode === mode.value, disabled || mode.soon)}
                        >
                            {mode.label}
                            {mode.soon ? (
                                <span className='ml-1 rounded-full bg-zinc-200 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-zinc-700 uppercase dark:bg-zinc-700 dark:text-zinc-100'>
                                    Soon
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className='mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300'>Group</p>
                <div className='grid grid-cols-3 gap-2'>
                    {GROUPS.map((group) => (
                        <button
                            key={group.value}
                            type='button'
                            disabled={disabled}
                            onClick={() => onChange({ ...value, group: group.value })}
                            className={choiceClass(value.group === group.value, disabled)}
                        >
                            {group.label}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className='mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300'>Image style</p>
                <div className='grid grid-cols-2 gap-2'>
                    {IMAGE_MODES.map((mode) => (
                        <button
                            key={mode}
                            type='button'
                            disabled={disabled}
                            onClick={() => onChange({ ...value, image_mode: mode })}
                            className={choiceClass(value.image_mode === mode, disabled)}
                        >
                            {IMAGE_MODE_LABELS[mode]}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className='mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300'>Generation</p>
                <div className='flex flex-wrap gap-2'>
                    {INFINITE_GEN_OPTIONS.map((option) => (
                        <button
                            key={option.value}
                            type='button'
                            disabled={disabled}
                            onClick={() => toggleGen(option.value)}
                            className={`cursor-pointer rounded-full border-2 px-3 py-1 text-sm font-medium ${
                                value.gens.includes(option.value)
                                    ? 'border-pink-500 bg-pink-500 text-white'
                                    : 'border-gray-200 dark:border-zinc-700'
                            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>
            <div>
                <p className='mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300'>Difficulty</p>
                <div className='grid grid-cols-2 gap-2 sm:grid-cols-4'>
                    {DIFFICULTIES.map((difficulty: InfiniteDifficulty) => (
                        <button
                            key={difficulty}
                            type='button'
                            disabled={disabled}
                            onClick={() => onChange({ ...value, difficulty })}
                            className={choiceClass(value.difficulty === difficulty, disabled)}
                        >
                            {DIFFICULTY_LABELS[difficulty]}
                        </button>
                    ))}
                </div>
                <p className='mt-2 text-xs text-gray-500 dark:text-zinc-400'>
                    Duels has no hints or skips. Difficulty only changes guesses and how fast the image clears.
                </p>
            </div>
        </div>
    )
}
