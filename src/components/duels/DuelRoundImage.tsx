'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import { useCallback, useMemo, useState } from 'react'
import { getImageUrl } from '@/lib/supabase'
import { getZoomScale, type ImageMode, type InfiniteDifficulty } from '@/utils/difficulty'
import type { DuelPublicIdol } from '@/lib/duels/types'

function slotsFor(maxGuesses: number, revealed: boolean): Array<number | 'clear'> {
    if (maxGuesses <= 3) return revealed ? [1, 2, 3, 'clear'] : [1, 2, 3]
    return [1, 2, 3, 4, 5, 'clear']
}

function targetSlot(
    guessesUsed: number,
    maxGuesses: number,
    revealed: boolean
): number | 'clear' {
    if (revealed) return 'clear'
    if (maxGuesses <= 3) return Math.min(maxGuesses, guessesUsed + 1)
    if (maxGuesses - guessesUsed <= 1) return 'clear'
    return Math.min(5, guessesUsed + 1)
}

export default function DuelRoundImage({
    idol,
    difficulty,
    imageMode,
    guessesUsed,
    maxGuesses,
    revealed,
}: {
    idol: DuelPublicIdol
    difficulty: InfiniteDifficulty
    imageMode: ImageMode
    guessesUsed: number
    maxGuesses: number
    revealed: boolean
}) {
    const reduce = useReducedMotion()
    const limit = maxGuesses > 0 ? maxGuesses : difficulty === 'challenger' ? 3 : 6
    const slots = useMemo(() => slotsFor(limit, revealed), [limit, revealed])
    const urls = useMemo(
        () =>
            slots.map((slot) =>
                getImageUrl(
                    idol.group_type,
                    idol.img_bucket,
                    imageMode === 'zoom' ? 'clear' : slot,
                    'unlimited',
                    idol.group_category,
                    idol.base64_group
                )
            ),
        [slots, imageMode, idol.group_type, idol.img_bucket, idol.group_category, idol.base64_group]
    )
    const [loadedState, setLoadedState] = useState<{
        id: number | null
        slots: Array<number | 'clear'>
    }>({ id: null, slots: [] })
    const loaded = loadedState.id === idol.id ? loadedState.slots : []
    const mark = useCallback((id: number, slot: number | 'clear') => {
        setLoadedState((prev) => {
            const prevSlots = prev.id === id ? prev.slots : []
            if (prevSlots.includes(slot)) return prev
            return { id, slots: [...prevSlots, slot] }
        })
    }, [])

    const zoomUrl =
        imageMode === 'zoom'
            ? getImageUrl(
                  idol.group_type,
                  idol.img_bucket,
                  'clear',
                  'unlimited',
                  idol.group_category,
                  idol.base64_group
              )
            : ''
    const target = targetSlot(guessesUsed, limit, revealed)
    const targetIndex = Math.max(0, slots.indexOf(target))
    let shown = targetIndex
    if (!loaded.includes(slots[targetIndex])) {
        for (let index = targetIndex - 1; index >= 0; index -= 1) {
            if (loaded.includes(slots[index])) {
                shown = index
                break
            }
        }
    }
    const frame = slots[shown]
    const scale = getZoomScale(guessesUsed, limit, revealed)
    const origin = `${idol.zoom_x ?? 50}% ${idol.zoom_y ?? 50}%`
    const keep = new Set<number>([shown, targetIndex])
    if (targetIndex + 1 < slots.length) keep.add(targetIndex + 1)
    const mounted =
        imageMode === 'zoom'
            ? []
            : slots
                  .map((slot, index) => ({ slot, index, url: urls[index] }))
                  .filter(({ index, url }) => url && keep.has(index))

    return (
        <div
            className='relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-200 select-none dark:bg-zinc-800'
            onContextMenu={(event) => event.preventDefault()}
        >
            {imageMode === 'zoom' && zoomUrl ? (
                <motion.div
                    key={`${idol.id}-zoom`}
                    className='absolute inset-0'
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, scale }}
                    transition={reduce ? { duration: 0.15 } : { duration: 0.35 }}
                    style={{ transformOrigin: origin }}
                >
                    <Image
                        src={zoomUrl}
                        alt=''
                        fill
                        unoptimized
                        draggable={false}
                        className='object-cover select-none'
                        onContextMenu={(event) => event.preventDefault()}
                    />
                </motion.div>
            ) : (
                <>
                    {mounted.map(({ slot, url }) =>
                        slot === frame ? null : (
                            <Image
                                key={`${idol.id}-${slot}-prefetch`}
                                src={url}
                                alt=''
                                fill
                                unoptimized
                                draggable={false}
                                aria-hidden
                                loading='eager'
                                className='pointer-events-none object-cover opacity-0'
                                onLoad={() => mark(idol.id, slot)}
                                onError={() => mark(idol.id, slot)}
                            />
                        )
                    )}
                    <AnimatePresence mode='sync'>
                        <motion.div
                            key={`${idol.id}-${frame}`}
                            className='absolute inset-0'
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={reduce ? { duration: 0.15 } : { duration: 0.35 }}
                        >
                            <Image
                                src={urls[shown] || urls[0]}
                                alt=''
                                fill
                                unoptimized
                                draggable={false}
                                className='object-cover select-none'
                                onLoad={() => mark(idol.id, frame)}
                                onError={() => mark(idol.id, frame)}
                                onContextMenu={(event) => event.preventDefault()}
                            />
                        </motion.div>
                    </AnimatePresence>
                </>
            )}
        </div>
    )
}
