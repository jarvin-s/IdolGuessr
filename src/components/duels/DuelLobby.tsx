'use client'

import { motion, useReducedMotion } from 'motion/react'
import copy from 'copy-to-clipboard'
import { useState } from 'react'
import DuelConfigForm from '@/components/duels/DuelConfigForm'
import type { DuelConfig, DuelFormat, DuelLobby as Lobby, DuelPlayer } from '@/lib/duels/types'

const CAPS: Record<DuelFormat, number> = { '1v1': 1, '2v2': 2, '1v2': 2 }

function slots(format: DuelFormat, team: 1 | 2, members: DuelPlayer[]) {
    const filled = members.filter((member) => member.team === team)
    const empty = Math.max(0, CAPS[format] - filled.length)
    return { filled, empty }
}

export default function DuelLobby({
    lobby,
    myId,
    isHost,
    onlineIds,
    onChangeConfig,
    onChangeFormat,
    onMove,
    onKick,
    onStart,
    onLeave,
    canStart,
}: {
    lobby: Lobby
    myId: string
    isHost: boolean
    onlineIds: string[]
    canStart: boolean
    onChangeConfig: (config: DuelConfig) => void
    onChangeFormat: (format: DuelFormat) => void
    onMove: (userId: string, team: 1 | 2) => void
    onKick: (userId: string) => void
    onStart: () => void
    onLeave: () => void
}) {
    const reduce = useReducedMotion()
    const [copied, setCopied] = useState(false)
    const link = typeof window === 'undefined' ? '' : `${window.location.origin}/duels/${lobby.code}`
    const formats: DuelFormat[] = ['1v1', '2v2', '1v2']

    const column = (team: 1 | 2) => {
        const { filled, empty } = slots(lobby.format, team, lobby.members)
        return (
            <div className='space-y-2 rounded-md border border-gray-200 p-3 dark:border-zinc-700'>
                <p className='text-xs font-bold tracking-wide uppercase'>Team {team}</p>
                {filled.map((member) => (
                    <motion.div
                        layout
                        key={member.user_id}
                        className='flex items-center justify-between gap-2 rounded-md bg-zinc-100 px-2 py-2 dark:bg-zinc-800'
                    >
                        <span className='flex min-w-0 items-center gap-2'>
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    onlineIds.includes(member.user_id) ? 'bg-emerald-500' : 'bg-zinc-400'
                                }`}
                            />
                            <span className='truncate text-sm'>{member.nickname}</span>
                        </span>
                        {isHost && member.user_id !== myId ? (
                            <span className='flex gap-1'>
                                <button
                                    type='button'
                                    className='cursor-pointer text-xs underline'
                                    onClick={() => onMove(member.user_id, team === 1 ? 2 : 1)}
                                >
                                    Move
                                </button>
                                <button
                                    type='button'
                                    className='cursor-pointer text-xs text-red-500 underline'
                                    onClick={() => onKick(member.user_id)}
                                >
                                    Kick
                                </button>
                            </span>
                        ) : null}
                    </motion.div>
                ))}
                {Array.from({ length: empty }, (_, index) => (
                    <div
                        key={`empty-${team}-${index}`}
                        className='rounded-md border border-dashed border-zinc-300 px-2 py-3 text-center text-xs text-zinc-400'
                    >
                        Open seat
                    </div>
                ))}
            </div>
        )
    }

    return (
        <motion.div initial={reduce ? { opacity: 0 } : undefined} animate={{ opacity: 1 }} className='space-y-4'>
            <div className='text-center'>
                <p className='text-4xl font-bold tracking-[0.35em]'>{lobby.code}</p>
                <button
                    type='button'
                    className='mt-2 cursor-pointer text-sm underline'
                    onClick={() => {
                        copy(link)
                        setCopied(true)
                    }}
                >
                    {copied ? 'Copied' : 'Copy invite link'}
                </button>
            </div>
            <div className='grid grid-cols-3 gap-2'>
                {formats.map((format) => (
                    <button
                        key={format}
                        type='button'
                        disabled={!isHost}
                        onClick={() => onChangeFormat(format)}
                        className={`cursor-pointer border-2 px-3 py-2 ${
                            lobby.format === format
                                ? 'border-pink-500 bg-pink-500 text-white'
                                : 'border-gray-200 dark:border-zinc-700'
                        } disabled:cursor-default`}
                    >
                        {format}
                    </button>
                ))}
            </div>
            <div className='grid gap-3 sm:grid-cols-2'>
                {column(1)}
                {column(2)}
            </div>
            <DuelConfigForm value={lobby.config} onChange={onChangeConfig} disabled={!isHost} />
            <div className='flex justify-between gap-2'>
                <button type='button' onClick={onLeave} className='cursor-pointer rounded-full border px-4 py-2'>
                    Leave
                </button>
                {isHost ? (
                    <button
                        type='button'
                        disabled={!canStart}
                        onClick={onStart}
                        className='cursor-pointer rounded-full bg-pink-500 px-4 py-2 text-white disabled:opacity-40'
                    >
                        Start
                    </button>
                ) : (
                    <p className='self-center text-sm text-zinc-500'>Waiting for the host</p>
                )}
            </div>
        </motion.div>
    )
}
