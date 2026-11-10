'use client'

import { useEffect, useState } from 'react'
import { getProfile, savePlayerSettings } from '@/lib/player'

export type InputMode = 'keyboard' | 'text'

const CHANGE_EVENT = 'idol-guessr-input-mode-change'

export function loadInputMode(): InputMode {
    return getProfile()?.input_mode === 'text' ? 'text' : 'keyboard'
}

export function saveInputMode(mode: InputMode): void {
    void savePlayerSettings({ input_mode: mode })
    window.dispatchEvent(new Event(CHANGE_EVENT))
}

export function useInputMode(): [InputMode, (mode: InputMode) => void, boolean] {
    const [mode, setMode] = useState<InputMode>('keyboard')
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setMode(loadInputMode())
        setReady(true)
        const sync = () => setMode(loadInputMode())
        window.addEventListener(CHANGE_EVENT, sync)
        return () => {
            window.removeEventListener(CHANGE_EVENT, sync)
        }
    }, [])

    return [mode, (next: InputMode) => {
        saveInputMode(next)
        setMode(next)
    }, ready]
}
