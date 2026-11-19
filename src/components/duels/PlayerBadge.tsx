'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import type { DuelPlayer } from '@/lib/duels/types'

export default function PlayerBadge({
    player,
    online,
    done,
    correct,
}: {
    player: DuelPlayer
    online: boolean
    done: boolean
    correct: boolean
}) {
    const reduce = useReducedMotion()
    const initials = player.nickname.slice(0, 2).toUpperCase()
    const dim = !online || player.left

    return (
        <motion.div
            layout
            className='flex min-w-0 items-center gap-2'
            animate={{ opacity: dim ? 0.4 : 1 }}
            transition={reduce ? { duration: 0.15 } : undefined}
        >
            {player.avatar_url ? (
                <Image
                    src={player.avatar_url}
                    alt=''
                    width={36}
                    height={36}
                    className='h-9 w-9 rounded-full object-cover'
                />
            ) : (
                <span className='flex h-9 w-9 items-center justify-center rounded-full bg-zinc-200 text-xs font-bold dark:bg-zinc-700'>
                    {initials}
                </span>
            )}
            <span className='truncate text-sm font-medium'>{player.nickname}</span>
            {correct ? (
                <motion.span
                    initial={reduce ? { opacity: 0 } : { scale: 0, opacity: 0 }}
                    animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                    transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 260, damping: 16 }}
                    className='text-emerald-500'
                    aria-label='Correct'
                >
                    ✓
                </motion.span>
            ) : done ? (
                <span className='text-xs text-zinc-400'>···</span>
            ) : null}
        </motion.div>
    )
}
