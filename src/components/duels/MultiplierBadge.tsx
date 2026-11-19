'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export default function MultiplierBadge({ multiplier }: { multiplier: number }) {
    const reduce = useReducedMotion()
    if (multiplier <= 1) return null
    const label = `x${multiplier % 1 === 0 ? multiplier.toFixed(0) : multiplier.toFixed(1)}`
    return (
        <AnimatePresence mode='wait'>
            <motion.span
                key={label}
                initial={reduce ? { opacity: 0 } : { scale: 0.6, rotate: -12, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                className='rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-amber-950'
            >
                {label}
            </motion.span>
        </AnimatePresence>
    )
}
