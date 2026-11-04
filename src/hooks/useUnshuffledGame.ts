'use client'

import { useCallback, useRef, useState } from 'react'

export const SLOT_COUNT = 16
export const LOCKED_SLOTS = [0, 15]

export function isLockedSlot(slot: number) {
    return LOCKED_SLOTS.includes(slot)
}

export interface UnshuffledState {
    board: (number | null)[]
    tray: number[]
    checksUsed: number
    wrongSlots: number[]
    won: boolean
}

function shuffled<T>(items: T[]): T[] {
    const next = [...items]
    for (let i = next.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const swap = next[i]
        next[i] = next[j]
        next[j] = swap
    }
    return next
}

export function createUnshuffledState(): UnshuffledState {
    const board: (number | null)[] = Array.from({ length: SLOT_COUNT }, () => null)
    for (const slot of LOCKED_SLOTS) board[slot] = slot
    const tray = shuffled(
        Array.from({ length: SLOT_COUNT }, (_, piece) => piece).filter(
            (piece) => !isLockedSlot(piece)
        )
    )
    return { board, tray, checksUsed: 0, wrongSlots: [], won: false }
}

function solved(board: (number | null)[]) {
    return board.every((piece, slot) => piece === slot)
}

export function useUnshuffledGame() {
    const [state, setState] = useState<UnshuffledState>(createUnshuffledState)
    const stateRef = useRef(state)
    const clearTimer = useRef<number | null>(null)
    stateRef.current = state

    const cancelReturn = useCallback(() => {
        if (clearTimer.current !== null) {
            window.clearTimeout(clearTimer.current)
            clearTimer.current = null
        }
    }, [])

    const place = useCallback(
        (piece: number, slot: number) => {
            if (isLockedSlot(slot) || isLockedSlot(piece)) return
            cancelReturn()
            setState((current) => {
                if (current.won) return current
                const board = [...current.board]
                const fromSlot = board.indexOf(piece)
                if (fromSlot === slot) return { ...current, wrongSlots: [] }
                const displaced = board[slot]
                let tray = current.tray.filter((item) => item !== piece)
                if (fromSlot >= 0 && displaced !== null) {
                    board[fromSlot] = displaced
                    board[slot] = piece
                } else {
                    if (fromSlot >= 0) board[fromSlot] = null
                    board[slot] = piece
                    if (displaced !== null) tray = [...tray, displaced]
                }
                return {
                    ...current,
                    board,
                    tray,
                    wrongSlots: [],
                    won: solved(board),
                }
            })
        },
        [cancelReturn]
    )

    const returnToTray = useCallback((slot: number) => {
        if (isLockedSlot(slot)) return
        setState((current) => {
            if (current.won) return current
            const piece = current.board[slot]
            if (piece === null) return current
            const board = [...current.board]
            board[slot] = null
            return {
                ...current,
                board,
                tray: [...current.tray, piece],
                wrongSlots: current.wrongSlots.filter((item) => item !== slot),
            }
        })
    }, [])

    const check = useCallback(() => {
        cancelReturn()
        const current = stateRef.current
        if (current.won) return
        const checksUsed = current.checksUsed + 1
        if (solved(current.board)) {
            setState({ ...current, checksUsed, won: true, wrongSlots: [] })
            return
        }
        const wrongSlots = current.board.flatMap((piece, slot) =>
            piece !== null && piece !== slot ? [slot] : []
        )
        setState({ ...current, checksUsed, wrongSlots })
        if (wrongSlots.length === 0) return
        clearTimer.current = window.setTimeout(() => {
            clearTimer.current = null
            setState((latest) => {
                if (latest.won) return latest
                const board = [...latest.board]
                const returned: number[] = []
                for (const slot of wrongSlots) {
                    const piece = board[slot]
                    if (piece !== null && piece !== slot) {
                        board[slot] = null
                        returned.push(piece)
                    }
                }
                return {
                    ...latest,
                    board,
                    tray: [
                        ...latest.tray.filter((piece) => !returned.includes(piece)),
                        ...returned,
                    ],
                    wrongSlots: [],
                }
            })
        }, 700)
    }, [cancelReturn])

    const shuffle = useCallback(() => {
        cancelReturn()
        setState(createUnshuffledState())
    }, [cancelReturn])

    return { ...state, place, returnToTray, check, shuffle }
}
