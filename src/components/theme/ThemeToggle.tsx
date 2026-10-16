'use client'

import { useTheme } from './ThemeProvider'
import type { ThemeChoice } from './theme'

const options: { id: ThemeChoice; label: string }[] = [
    { id: 'light', label: 'Light' },
    { id: 'dark', label: 'Dark' },
    { id: 'system', label: 'System' },
]

function ThemeIconMask({
    src,
    className = 'h-[18px] w-[18px]',
}: {
    src: string
    className?: string
}) {
    return (
        <span
            aria-hidden
            className={`inline-block bg-current mask-contain mask-center mask-no-repeat ${className}`}
            style={{
                maskImage: `url(${src})`,
                WebkitMaskImage: `url(${src})`,
            }}
        />
    )
}

function ThemeOptionIcon({ id }: { id: ThemeChoice }) {
    if (id === 'light') {
        return <ThemeIconMask src='/icons/sun.svg' />
    }
    if (id === 'dark') {
        return <ThemeIconMask src='/icons/moon.svg' />
    }
    return (
        <span className='inline-flex items-center' aria-hidden>
            <p>System</p>
        </span>
    )
}

export default function ThemeToggle({
    className = '',
}: {
    className?: string
}) {
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
                        aria-label={option.label}
                        aria-pressed={selected}
                        className={`flex cursor-pointer items-center justify-center rounded-full px-2.5 py-2 transition-colors ${
                            selected
                                ? 'bg-white text-black shadow-sm dark:bg-zinc-950 dark:text-zinc-100'
                                : 'text-gray-600 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-100'
                        }`}
                    >
                        <ThemeOptionIcon id={option.id} />
                    </button>
                )
            })}
        </div>
    )
}
