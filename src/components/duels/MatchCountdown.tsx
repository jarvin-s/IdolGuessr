'use client'

import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export default function MatchCountdown({ secondsToStart }: { secondsToStart: number }) {
    const reduce = useReducedMotion()
    const label = secondsToStart > 0 ? String(Math.ceil(secondsToStart)) : 'GO'
    return (
        <div className='pointer-events-none absolute inset-0 z-20 flex items-center justify-center'>
            <AnimatePresence mode='wait'>
                <motion.span
                    key={label}
                    initial={reduce ? { opacity: 0 } : { scale: 2, opacity: 0 }}
                    animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                    exit={reduce ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className='text-8xl font-bold text-white drop-shadow-lg'
                >
                    {label}
                </motion.span>
            </AnimatePresence>
        </div>
    )
}
