'use client'

import { motion, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { useEffect } from 'react'
import { START_HP } from '@/lib/duels/constants'

export default function HealthBar({
    hp,
    max = START_HP,
    side,
    tone,
    shake = false,
}: {
    hp: number
    max?: number
    side: 'left' | 'right'
    tone: 'me' | 'opponent'
    shake?: boolean
}) {
    const reduce = useReducedMotion()
    const pct = Math.max(0, Math.min(100, (hp / max) * 100))
    const spring = useSpring(hp, { stiffness: 80, damping: 20 })
    const text = useTransform(spring, (value) => Math.round(value).toLocaleString())
    useEffect(() => {
        spring.set(hp)
    }, [hp, spring])

    const fill = tone === 'me' ? 'bg-pink-500' : 'bg-sky-500'
    const ghost = tone === 'me' ? 'bg-pink-300' : 'bg-sky-300'

    return (
        <motion.div
            className='relative h-8 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800'
            animate={
                reduce || !shake
                    ? { x: 0, opacity: 1 }
                    : { x: [0, -6, 6, -4, 4, 0] }
            }
            transition={reduce ? { duration: 0.15 } : { duration: 0.4 }}
        >
            <motion.div
                className={`absolute top-0 bottom-0 ${ghost}`}
                style={{ [side === 'left' ? 'left' : 'right']: 0 }}
                initial={false}
                animate={reduce ? { opacity: 0.7, width: `${pct}%` } : { width: `${pct}%` }}
                transition={reduce ? { duration: 0.15 } : { duration: 0.45, delay: 0.4 }}
            />
            <motion.div
                className={`absolute top-0 bottom-0 ${fill}`}
                style={{ [side === 'left' ? 'left' : 'right']: 0 }}
                initial={false}
                animate={reduce ? { opacity: 1, width: `${pct}%` } : { width: `${pct}%` }}
                transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 120, damping: 20 }}
            />
            <motion.span className='absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-950'>
                {text}
            </motion.span>
        </motion.div>
    )
}
