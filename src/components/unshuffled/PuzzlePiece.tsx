'use client'

import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'

const DRAG_THRESHOLD = 5

export function pieceBackground(
    piece: number,
    artworkUrl: string
): CSSProperties {
    const col = piece % 4
    const row = Math.floor(piece / 4)
    return {
        backgroundImage: `url("${artworkUrl}")`,
        backgroundSize: '400% 400%',
        backgroundPosition: `${(col * 100) / 3}% ${(row * 100) / 3}%`,
        backgroundRepeat: 'no-repeat',
    }
}

interface PuzzlePieceProps {
    piece: number
    artworkUrl: string
    locked?: boolean
    wrong?: boolean
    className?: string
    onTap: (piece: number) => void
    onDragMove: (slot: number | null) => void
    onDragEnd: (piece: number, slot: number | null) => void
}

function slotAt(x: number, y: number, source: HTMLElement) {
    const previous = source.style.visibility
    source.style.visibility = 'hidden'
    const hit = document.elementFromPoint(x, y)
    source.style.visibility = previous
    const slot = hit?.closest('[data-slot]')
    if (!slot) return null
    const value = Number(slot.getAttribute('data-slot'))
    return Number.isInteger(value) ? value : null
}

export default function PuzzlePiece({
    piece,
    artworkUrl,
    locked = false,
    wrong = false,
    className = '',
    onTap,
    onDragMove,
    onDragEnd,
}: PuzzlePieceProps) {
    const origin = useRef({ x: 0, y: 0 })
    const dragging = useRef(false)
    const moved = useRef(false)
    const [ghost, setGhost] = useState<{
        x: number
        y: number
        size: number
    } | null>(null)

    function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
        const target = event.currentTarget
        origin.current = { x: event.clientX, y: event.clientY }
        dragging.current = false
        moved.current = false

        const move = (ev: globalThis.PointerEvent) => {
            const distance = Math.hypot(
                ev.clientX - origin.current.x,
                ev.clientY - origin.current.y
            )
            if (distance >= DRAG_THRESHOLD) moved.current = true
            if (!moved.current || locked) return
            dragging.current = true
            const rect = target.getBoundingClientRect()
            setGhost({ x: ev.clientX, y: ev.clientY, size: rect.width })
            onDragMove(slotAt(ev.clientX, ev.clientY, target))
        }
        const finish = (ev: globalThis.PointerEvent) => {
            window.removeEventListener('pointermove', move)
            window.removeEventListener('pointerup', finish)
            window.removeEventListener('pointercancel', finish)
            const wasDragging = dragging.current
            const didMove = moved.current
            dragging.current = false
            moved.current = false
            setGhost(null)
            onDragMove(null)
            if (!didMove) {
                onTap(piece)
                return
            }
            if (!wasDragging) return
            onDragEnd(piece, slotAt(ev.clientX, ev.clientY, target))
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', finish)
        window.addEventListener('pointercancel', finish)
    }

    return (
        <>
            <button
                type='button'
                aria-label={`Song piece ${piece + 1}`}
                className={`touch-none bg-zinc-200 select-none dark:bg-zinc-700 ${
                    locked
                        ? 'cursor-default'
                        : 'cursor-grab active:cursor-grabbing'
                } ${wrong ? 'ring-2 ring-red-500 ring-inset' : ''} ${
                    ghost ? 'opacity-40' : ''
                } ${className}`}
                style={pieceBackground(piece, artworkUrl)}
                onPointerDown={onPointerDown}
            />
            {ghost && (
                <div
                    className='pointer-events-none fixed z-[600] -translate-x-1/2 -translate-y-1/2 rounded-sm shadow-lg'
                    style={{
                        left: ghost.x,
                        top: ghost.y,
                        width: ghost.size,
                        height: ghost.size,
                        ...pieceBackground(piece, artworkUrl),
                    }}
                />
            )}
        </>
    )
}
