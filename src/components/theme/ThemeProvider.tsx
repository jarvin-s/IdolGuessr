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
import { getProfile, savePlayerSettings } from '@/lib/player'

interface ThemeContextValue {
    theme: ThemeChoice
    setTheme: (choice: ThemeChoice) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setThemeState] = useState<ThemeChoice>('system')

    useEffect(() => {
        const stored = getProfile()?.theme
        const cookie = document.cookie.match(/(?:^|; )idol-guessr-theme=([^;]+)/)
        const fromCookie = cookie ? decodeURIComponent(cookie[1]) : null
        const choice = isThemeChoice(stored ?? null)
            ? stored!
            : isThemeChoice(fromCookie)
              ? fromCookie
              : 'system'
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
        document.cookie = `${THEME_STORAGE_KEY}=${choice}; path=/; max-age=31536000; samesite=lax`
        void savePlayerSettings({ theme: choice })
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
