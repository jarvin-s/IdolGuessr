'use client'

import { useEffect, useState } from 'react'

export type InputMode = 'keyboard' | 'text'

const STORAGE_KEY = 'idol-guessr-input-mode'
const CHANGE_EVENT = 'idol-guessr-input-mode-change'

export function loadInputMode(): InputMode {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'text' ? 'text' : 'keyboard'
    } catch {
        return 'keyboard'
    }
}

export function saveInputMode(mode: InputMode): void {
    try {
        localStorage.setItem(STORAGE_KEY, mode)
        window.dispatchEvent(new Event(CHANGE_EVENT))
    } catch {
        // Ignore storage errors (e.g. private mode)
    }
}

export function useInputMode(): [InputMode, (mode: InputMode) => void, boolean] {
    const [mode, setMode] = useState<InputMode>('keyboard')
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setMode(loadInputMode())
        setReady(true)
        const sync = () => setMode(loadInputMode())
        window.addEventListener(CHANGE_EVENT, sync)
        window.addEventListener('storage', sync)
        return () => {
            window.removeEventListener(CHANGE_EVENT, sync)
            window.removeEventListener('storage', sync)
        }
    }, [])

    return [mode, (next: InputMode) => {
        saveInputMode(next)
        setMode(next)
    }, ready]
}
