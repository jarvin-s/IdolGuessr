'use client'

import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import type { DuelPlayer } from '@/lib/duels/types'

export default function DuelResultModal({
    winnerTeam,
    myTeam,
    players,
    teamHp,
    onRematch,
    onHome,
    abandoned = false,
}: {
    winnerTeam: 1 | 2 | null
    myTeam: 1 | 2
    players: DuelPlayer[]
    teamHp: [number, number]
    onRematch?: () => void
    onHome: () => void
    abandoned?: boolean
}) {
    const reduce = useReducedMotion()
    const victory = winnerTeam === myTeam
    const title = abandoned ? 'Abandoned' : victory ? 'Victory' : 'Defeat'
    const [size, setSize] = useState({ width: 0, height: 0 })
    useEffect(() => {
        const update = () => setSize({ width: window.innerWidth, height: window.innerHeight })
        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])
    const letters = title.split('')

    return (
        <div className='absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4'>
            {victory && size.width > 0 ? (
                <div className='pointer-events-none fixed inset-0 z-60'>
                    <Confetti width={size.width} height={size.height} recycle={false} numberOfPieces={220} />
                </div>
            ) : null}
            <motion.div
                initial={reduce ? { opacity: 0 } : { scale: 0.85, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { scale: 1, opacity: 1 }}
                transition={reduce ? { duration: 0.15 } : { type: 'spring', stiffness: 180, damping: 18 }}
                className='w-full max-w-sm rounded-md bg-white p-6 text-center dark:bg-zinc-900'
            >
                <h2 className='text-4xl font-bold uppercase'>
                    {victory && !reduce
                        ? letters.map((letter, index) => (
                              <motion.span
                                  key={`${letter}-${index}`}
                                  initial={{ opacity: 0, y: 8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.04 }}
                              >
                                  {letter}
                              </motion.span>
                          ))
                        : title}
                </h2>
                <p className='mt-3 text-sm text-zinc-500'>
                    Final HP {teamHp[0].toLocaleString()} – {teamHp[1].toLocaleString()}
                </p>
                <p className='mt-1 text-sm'>
                    {players
                        .filter((player) => player.team === (victory ? myTeam : winnerTeam ?? myTeam))
                        .map((player) => player.nickname)
                        .join(', ') || 'Your team'}
                </p>
                <div className='mt-5 flex justify-center gap-2'>
                    {onRematch ? (
                        <button
                            type='button'
                            onClick={onRematch}
                            className='cursor-pointer rounded-full bg-pink-500 px-4 py-2 text-white'
                        >
                            Rematch
                        </button>
                    ) : null}
                    <button
                        type='button'
                        onClick={onHome}
                        className='cursor-pointer rounded-full border-2 border-gray-200 px-4 py-2 dark:border-zinc-700'
                    >
                        Home
                    </button>
                </div>
            </motion.div>
        </div>
    )
}
