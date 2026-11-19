'use client'

import { useCallback, useRef } from 'react'

export function useServerClock() {
    const offset = useRef(0)
    const now = useCallback(() => Date.now() + offset.current, [])
    const sync = useCallback((serverIso: string) => {
        const parsed = Date.parse(serverIso)
        if (Number.isNaN(parsed)) return
        offset.current = parsed - Date.now()
    }, [])
    return { now, sync }
}
