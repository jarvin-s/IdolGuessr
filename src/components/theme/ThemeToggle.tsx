'use client'

import { useTheme } from './ThemeProvider'
import type { ThemeChoice } from './theme'

const options: { id: ThemeChoice; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'system', label: 'System' },
]

export default function ThemeToggle({ className = '' }: { className?: string }) {
    const { theme, setTheme } = useTheme()

    return (
        <div
            className={`flex rounded-full bg-gray-100 p-1 dark:bg-zinc-800 ${className}`}
            role='group'
            aria-label='Color theme'
        >
            {options.map((option) => {
                const selected = theme === option.id
                return (
                    <button
                        key={option.id}
                        type='button'
                        onClick={() => setTheme(option.id)}
                        aria-pressed={selected}
                        className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                            selected
                                ? 'bg-white text-black shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                                : 'text-gray-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                    >
                        {option.label}
                    </button>
                )
            })}
        </div>
    )
}
