'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'
import { getProfile, savePlayerSettings, subscribePlayer } from '@/lib/player'

const COLORBLIND_KEY = 'colorblind'
const ATTRIBUTE_ICONS_KEY = 'attribute-icons'

interface ColorblindContextValue {
    colorblind: boolean
    setColorblind: (value: boolean) => void
    attributeIcons: boolean
    setAttributeIcons: (value: boolean) => void
}

const ColorblindContext = createContext<ColorblindContextValue | null>(null)

function storedFlag(key: string, notice: string, fallback: boolean) {
    const stored = localStorage.getItem(key)
    if (stored === '1' || stored === '0') return stored === '1'
    const flag = getProfile()?.seen_notices?.[notice]
    if (typeof flag !== 'boolean') return fallback
    localStorage.setItem(key, flag ? '1' : '0')
    return flag
}

export function ColorblindProvider({ children }: { children: ReactNode }) {
    const [colorblind, setColorblindState] = useState(false)
    const [attributeIcons, setAttributeIconsState] = useState(true)

    useEffect(() => {
        const apply = () => {
            setColorblindState(storedFlag(COLORBLIND_KEY, 'colorblind', false))
            setAttributeIconsState(storedFlag(ATTRIBUTE_ICONS_KEY, 'attribute_icons', false))
        }
        apply()
        return subscribePlayer(apply)
    }, [])

    const setColorblind = (value: boolean) => {
        setColorblindState(value)
        localStorage.setItem(COLORBLIND_KEY, value ? '1' : '0')
        void savePlayerSettings({ seen_notices: { colorblind: value } })
    }

    const setAttributeIcons = (value: boolean) => {
        setAttributeIconsState(value)
        localStorage.setItem(ATTRIBUTE_ICONS_KEY, value ? '1' : '0')
        void savePlayerSettings({ seen_notices: { attribute_icons: value } })
    }

    return (
        <ColorblindContext.Provider
            value={{ colorblind, setColorblind, attributeIcons, setAttributeIcons }}
        >
            {children}
        </ColorblindContext.Provider>
    )
}

export function useColorblind() {
    const context = useContext(ColorblindContext)
    if (!context) {
        throw new Error('useColorblind must be used within ColorblindProvider')
    }
    return context
}
