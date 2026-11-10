'use client'

import { useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { createPortal } from 'react-dom'

const DRAG_THRESHOLD = 5
const BLUR_BLEED = 0.35

export function pieceBackground(
    piece: number,
    artworkUrl: string,
    bleed = 0
): CSSProperties {
    const col = piece % 4
    const row = Math.floor(piece / 4)
    const scale = 1 + bleed * 2
    const size = 400 / scale
    const x = ((bleed - col) / (scale - 4)) * 100
    const y = ((bleed - row) / (scale - 4)) * 100
    return {
        backgroundImage: `url("${artworkUrl}")`,
        backgroundSize: `${size}% ${size}%`,
        backgroundPosition: `${x}% ${y}%`,
        backgroundRepeat: 'no-repeat',
    }
}

function BlurredArtwork({
    piece,
    artworkUrl,
}: {
    piece: number
    artworkUrl: string
}) {
    const bleed = `${BLUR_BLEED * 100}%`
    return (
        <span
            aria-hidden
            className='pointer-events-none absolute blur-xl'
            style={{
                top: `-${bleed}`,
                right: `-${bleed}`,
                bottom: `-${bleed}`,
                left: `-${bleed}`,
                ...pieceBackground(piece, artworkUrl, BLUR_BLEED),
            }}
        />
    )
}

interface PuzzlePieceProps {
    piece: number
    artworkUrl: string
    locked?: boolean
    correct?: boolean
    active?: boolean
    onBoard?: boolean
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
    correct = false,
    active = false,
    onBoard = false,
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
            setGhost({
                x: ev.clientX,
                y: ev.clientY,
                size: target.offsetWidth,
            })
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
                className={`relative touch-none overflow-hidden bg-zinc-200 select-none dark:bg-zinc-700 ${
                    onBoard
                        ? ''
                        : 'hover:scale-105 transition-transform duration-100 ease-in-out'
                } ${
                    locked
                        ? 'cursor-default'
                        : 'cursor-grab active:cursor-grabbing'
                } ${
                    active
                        ? 'border-2 border-white'
                        : correct
                          ? 'border-2 border-green-400'
                          : ''
                } ${
                    ghost ? 'opacity-40' : ''
                } ${className}`}
                onPointerDown={onPointerDown}
            >
                <BlurredArtwork piece={piece} artworkUrl={artworkUrl} />
                {locked && (
                    <span
                        aria-hidden
                        className='pointer-events-none absolute top-1 right-1 z-10 h-4 w-4 bg-black mask-contain mask-center mask-no-repeat [filter:drop-shadow(0_0_1px_#fff)_drop-shadow(0_0_1px_#fff)] dark:bg-white dark:[filter:drop-shadow(0_0_1px_#000)_drop-shadow(0_0_1px_#000)]'
                        style={{
                            maskImage: 'url(/icons/lock.svg)',
                            WebkitMaskImage: 'url(/icons/lock.svg)',
                        }}
                    />
                )}
            </button>
            {ghost &&
                createPortal(
                    <div
                        className='pointer-events-none fixed z-[600] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl shadow-lg'
                        style={{
                            left: ghost.x,
                            top: ghost.y,
                            width: ghost.size,
                            height: ghost.size,
                        }}
                    >
                        <BlurredArtwork piece={piece} artworkUrl={artworkUrl} />
                    </div>,
                    document.body
                )}
        </>
    )
}
