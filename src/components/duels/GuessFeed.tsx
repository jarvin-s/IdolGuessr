'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { GuessFeedItem } from '@/lib/duels/types'

export default function GuessFeed({ items }: { items: GuessFeedItem[] }) {
    const reduce = useReducedMotion()
    const shown = items.slice(-5)
    return (
        <ul className='pointer-events-none absolute top-24 left-3 z-10 flex w-52 flex-col gap-1'>
            <AnimatePresence initial={false}>
                {shown.map((item) => (
                    <motion.li
                        key={item.id}
                        layout
                        initial={reduce ? { opacity: 0 } : { opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className='rounded-md bg-black/70 px-2 py-1 text-xs text-white'
                    >
                        {item.text}
                    </motion.li>
                ))}
            </AnimatePresence>
        </ul>
    )
}
