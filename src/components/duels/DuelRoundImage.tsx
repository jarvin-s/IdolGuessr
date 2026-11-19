'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getImageUrl } from '@/lib/supabase'
import { getRevealFrame } from '@/lib/duels/reveal'
import { getZoomScale, type ImageMode, type InfiniteDifficulty } from '@/utils/difficulty'
import type { DuelPublicIdol } from '@/lib/duels/types'

function slotsFor(difficulty: InfiniteDifficulty, revealed: boolean): Array<number | 'clear'> {
    if (difficulty === 'challenger') return revealed ? [1, 2, 3, 'clear'] : [1, 2, 3]
    return [1, 2, 3, 4, 5, 'clear']
}

export default function DuelRoundImage({
    idol,
    difficulty,
    imageMode,
    step,
    revealed,
}: {
    idol: DuelPublicIdol
    difficulty: InfiniteDifficulty
    imageMode: ImageMode
    step: number
    revealed: boolean
}) {
    const reduce = useReducedMotion()
    const showClear = revealed || imageMode === 'zoom'
    const slots = useMemo(() => slotsFor(difficulty, showClear), [difficulty, showClear])
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
        [
            slots,
            imageMode,
            idol.group_type,
            idol.img_bucket,
            idol.group_category,
            idol.base64_group,
        ]
    )
    const [loaded, setLoaded] = useState<Array<number | 'clear'>>([])
    const mark = useCallback((slot: number | 'clear') => {
        setLoaded((prev) => (prev.includes(slot) ? prev : [...prev, slot]))
    }, [])

    useEffect(() => {
        setLoaded((current) => (current.length === 0 ? current : []))
        const images = urls.map((url) => {
            const img = new window.Image()
            img.src = url
            return img
        })
        return () => {
            images.forEach((img) => {
                img.src = ''
            })
        }
    }, [idol.id, urls])

    const target: number | 'clear' = revealed
        ? 'clear'
        : imageMode === 'zoom'
          ? 'clear'
          : getRevealFrame(step * (difficulty === 'challenger' ? 10000 : 5000), difficulty)
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
    const scale = getZoomScale(step, difficulty === 'challenger' ? 3 : 6, revealed)
    const origin = `${idol.zoom_x ?? 50}% ${idol.zoom_y ?? 50}%`

    return (
        <div
            className='relative aspect-square w-full overflow-hidden rounded-lg bg-zinc-200 select-none dark:bg-zinc-800'
            onContextMenu={(event) => event.preventDefault()}
        >
            <AnimatePresence mode='sync'>
                <motion.div
                    key={`${idol.id}-${frame}-${imageMode}`}
                    className='absolute inset-0'
                    initial={reduce ? { opacity: 0 } : { opacity: 0 }}
                    animate={{ opacity: 1, scale: imageMode === 'zoom' ? scale : 1 }}
                    exit={{ opacity: 0 }}
                    transition={reduce ? { duration: 0.15 } : { duration: 0.35 }}
                    style={{ transformOrigin: origin }}
                >
                    <Image
                        src={urls[shown] || urls[0]}
                        alt=''
                        fill
                        unoptimized
                        draggable={false}
                        className='object-cover select-none'
                        onLoad={() => mark(frame)}
                        onError={() => mark(frame)}
                        onContextMenu={(event) => event.preventDefault()}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    )
}
