'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export const SLOT_COUNT = 16
export const LOCKED_SLOTS = [0, 15]

export function isLockedSlot(slot: number) {
    return LOCKED_SLOTS.includes(slot)
}

export interface UnshuffledState {
    board: (number | null)[]
    tray: number[]
    checksUsed: number
    correctSlots: number[]
    won: boolean
    scatterSeed: number
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

export function createUnshuffledState(scatterSeed = 1): UnshuffledState {
    const board: (number | null)[] = Array.from({ length: SLOT_COUNT }, () => null)
    for (const slot of LOCKED_SLOTS) board[slot] = slot
    const tray = shuffled(
        Array.from({ length: SLOT_COUNT }, (_, piece) => piece).filter(
            (piece) => !isLockedSlot(piece)
        )
    )
    return {
        board,
        tray,
        checksUsed: 0,
        correctSlots: [],
        won: false,
        scatterSeed,
    }
}

function randomSeed() {
    return Math.floor(Math.random() * 0x7fffffff) + 1
}

function solved(board: (number | null)[]) {
    return board.every((piece, slot) => piece === slot)
}

export function useUnshuffledGame() {
    const [state, setState] = useState<UnshuffledState>(createUnshuffledState)
    const stateRef = useRef(state)
    stateRef.current = state

    useEffect(() => {
        setState((current) =>
            current.scatterSeed === 1
                ? { ...current, scatterSeed: randomSeed() }
                : current
        )
    }, [])

    const place = useCallback((piece: number, slot: number) => {
        if (isLockedSlot(slot) || isLockedSlot(piece)) return
        setState((current) => {
            if (current.won) return current
            const board = [...current.board]
            const fromSlot = board.indexOf(piece)
            if (fromSlot === slot) return current
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
            const won = solved(board)
            return {
                ...current,
                board,
                tray,
                correctSlots: won
                    ? board.map((_, index) => index)
                    : current.correctSlots.filter((index) => board[index] === index),
                won,
            }
        })
    }, [])

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
                correctSlots: current.correctSlots.filter((item) => item !== slot),
            }
        })
    }, [])

    const check = useCallback(() => {
        const current = stateRef.current
        if (current.won) return
        const checksUsed = current.checksUsed + 1
        const correctSlots = current.board.flatMap((piece, slot) =>
            piece === slot ? [slot] : []
        )
        setState({
            ...current,
            checksUsed,
            correctSlots,
            won: solved(current.board),
        })
    }, [])

    const shuffle = useCallback(() => {
        setState(createUnshuffledState(randomSeed()))
    }, [])

    return { ...state, place, returnToTray, check, shuffle }
}
