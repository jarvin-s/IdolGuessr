'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

export default function RoundTimer({
    secondsLeft,
    pressured,
}: {
    secondsLeft: number
    pressured: boolean
}) {
    const reduce = useReducedMotion()
    const [pulse, setPulse] = useState(0)
    const seconds = Math.max(0, Math.ceil(secondsLeft))
    const label = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
    const urgent = pressured || seconds <= 10

    useEffect(() => {
        if (!urgent) return
        setPulse((value) => value + 1)
    }, [seconds, urgent])

    return (
        <motion.div
            key={pressured ? 'pressure' : 'calm'}
            animate={
                reduce
                    ? { opacity: urgent ? 0.7 : 1 }
                    : pressured
                      ? { scale: [1, 1.25, 1] }
                      : { scale: pulse && urgent ? [1, 1.08, 1] : 1 }
            }
            transition={{ duration: 0.35 }}
            className={`text-center text-3xl font-bold tabular-nums ${urgent ? 'text-red-500' : ''}`}
        >
            {label}
        </motion.div>
    )
}
