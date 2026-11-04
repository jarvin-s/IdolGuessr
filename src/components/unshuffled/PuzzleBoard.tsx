'use client'

import PuzzlePiece from '@/components/unshuffled/PuzzlePiece'

interface PuzzleBoardProps {
    board: (number | null)[]
    artworkUrl: string
    hoverSlot: number | null
    correctSlots: number[]
    lockedSlots: number[]
    onTap: (piece: number) => void
    onDragMove: (slot: number | null) => void
    onDragEnd: (piece: number, slot: number | null) => void
}

export default function PuzzleBoard({
    board,
    artworkUrl,
    hoverSlot,
    correctSlots,
    lockedSlots,
    onTap,
    onDragMove,
    onDragEnd,
}: PuzzleBoardProps) {
    return (
        <div className='grid aspect-square w-full max-w-[440px] grid-cols-4 gap-1.5 rounded-lg bg-gray-200 p-1.5 dark:bg-zinc-800'>
            {board.map((piece, slot) => {
                const highlighted = hoverSlot === slot
                return (
                    <div
                        key={slot}
                        data-slot={slot}
                        className={`relative aspect-square overflow-hidden rounded-sm ${
                            highlighted
                                ? 'bg-green-500/20 ring-2 ring-green-500 ring-inset'
                                : 'bg-white dark:bg-zinc-900'
                        }`}
                    >
                        {piece !== null && (
                            <PuzzlePiece
                                piece={piece}
                                artworkUrl={artworkUrl}
                                locked={lockedSlots.includes(slot)}
                                correct={correctSlots.includes(slot)}
                                className='absolute inset-0 h-full w-full'
                                onTap={onTap}
                                onDragMove={onDragMove}
                                onDragEnd={onDragEnd}
                            />
                        )}
                    </div>
                )
            })}
        </div>
    )
}
