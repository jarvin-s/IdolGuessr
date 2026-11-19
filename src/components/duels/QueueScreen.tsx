'use client'

import { motion, useReducedMotion } from 'motion/react'
import { duelConfigSummary } from '@/lib/duels/config'
import type { DuelConfig } from '@/lib/duels/types'

export default function QueueScreen({
    config,
    elapsedSeconds,
    onCancel,
}: {
    config: DuelConfig
    elapsedSeconds: number
    onCancel: () => void
}) {
    const reduce = useReducedMotion()
    const minutes = Math.floor(elapsedSeconds / 60)
    const seconds = String(elapsedSeconds % 60).padStart(2, '0')
    return (
        <div className='flex flex-col items-center gap-4 py-16 text-center'>
            <motion.div
                aria-hidden
                className='h-28 w-28 rounded-full bg-zinc-300 dark:bg-zinc-700'
                animate={reduce ? { opacity: [0.6, 1, 0.6] } : { scale: [1, 1.05, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
            />
            <h2 className='text-2xl font-bold'>Searching for an opponent...</h2>
            <p className='tabular-nums text-zinc-500'>
                {minutes}:{seconds}
            </p>
            <p className='max-w-sm text-sm text-zinc-500'>{duelConfigSummary(config)}</p>
            <button type='button' onClick={onCancel} className='cursor-pointer rounded-full border px-4 py-2'>
                Cancel
            </button>
        </div>
    )
}
