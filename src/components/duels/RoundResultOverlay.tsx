'use client'

import { motion, useReducedMotion } from 'motion/react'
import DuelRoundImage from '@/components/duels/DuelRoundImage'
import type { DuelPlayer, DuelPublicIdol, DuelRoundResult } from '@/lib/duels/types'
import type { ImageMode, InfiniteDifficulty } from '@/utils/difficulty'

export default function RoundResultOverlay({
    result,
    players,
    myTeam,
    idol,
    imageMode,
    difficulty,
}: {
    result: DuelRoundResult
    players: DuelPlayer[]
    myTeam: 1 | 2
    idol: DuelPublicIdol | null
    imageMode: ImageMode
    difficulty: InfiniteDifficulty
}) {
    const reduce = useReducedMotion()
    const best = (team: 1 | 2) => {
        const members = players.filter((player) => player.team === team)
        const score = result.team_scores[team - 1]
        const scorer = members.find((player) => result.player_scores[player.user_id] === score)
        return { score, name: scorer?.nickname ?? 'Team' }
    }
    const left = best(myTeam)
    const right = best(myTeam === 1 ? 2 : 1)
    const damagedIsMine = result.damaged_team === myTeam
    const multiplier =
        result.team_scores[0] === result.team_scores[1] || result.damage === 0
            ? 1
            : result.damage / Math.abs(result.team_scores[0] - result.team_scores[1])

    return (
        <motion.div
            className='absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <motion.div
                initial={reduce ? { opacity: 0 } : { y: 16, opacity: 0 }}
                animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1 }}
                className='w-full max-w-sm rounded-md bg-white p-4 text-center dark:bg-zinc-900'
            >
                {idol ? (
                    <DuelRoundImage
                        idol={idol}
                        difficulty={difficulty}
                        imageMode={imageMode}
                        guessesUsed={0}
                        maxGuesses={difficulty === 'challenger' ? 3 : 6}
                        revealed
                    />
                ) : null}
                <p className='mt-3 text-2xl font-bold tracking-wide uppercase'>{result.answer}</p>
                <div className='mt-3 grid grid-cols-2 gap-3 text-sm'>
                    <p>
                        <span className='block font-bold'>{left.score}</span>
                        {left.name}
                    </p>
                    <p>
                        <span className='block font-bold'>{right.score}</span>
                        {right.name}
                    </p>
                </div>
                {result.damage > 0 && result.damaged_team ? (
                    <motion.p
                        className='mt-3 text-xl font-bold text-red-500'
                        initial={reduce ? { opacity: 0 } : { y: 0, x: 0, opacity: 1 }}
                        animate={
                            reduce
                                ? { opacity: 1 }
                                : {
                                      y: -40,
                                      x: damagedIsMine ? -80 : 80,
                                      opacity: 0,
                                  }
                        }
                        transition={{ duration: 1.1, delay: 0.6 }}
                    >
                        -{result.damage}
                        {multiplier > 1 ? ` x${Number(multiplier.toFixed(1))}` : ''}
                    </motion.p>
                ) : (
                    <p className='mt-3 text-sm text-zinc-500'>No damage</p>
                )}
            </motion.div>
        </motion.div>
    )
}
