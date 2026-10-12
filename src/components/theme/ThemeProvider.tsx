'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'
import {
    THEME_STORAGE_KEY,
    applyTheme,
    isThemeChoice,
    type ThemeChoice,
} from './theme'

interface ThemeContextValue {
    theme: ThemeChoice
    setTheme: (choice: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeChoice>('system')

    useEffect(() => {
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        const choice = isThemeChoice(stored) ? stored : 'system'
        setThemeState(choice)
        applyTheme(choice)
    }, [])

    useEffect(() => {
        if (theme !== 'system') return
        const media = window.matchMedia('(prefers-color-scheme: dark)')
        const onChange = () => applyTheme('system')
        media.addEventListener('change', onChange)
        return () => media.removeEventListener('change', onChange)
    }, [theme])

    const setTheme = (choice: ThemeChoice) => {
        setThemeState(choice)
        localStorage.setItem(THEME_STORAGE_KEY, choice)
        applyTheme(choice)
    }

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider')
    }
    return context
}
