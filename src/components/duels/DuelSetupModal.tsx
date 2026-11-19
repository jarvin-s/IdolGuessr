'use client'

import { useState } from 'react'
import DuelConfigForm from '@/components/duels/DuelConfigForm'
import { loadDuelConfig, saveDuelConfig } from '@/lib/duels/config'
import type { DuelConfig, DuelFormat } from '@/lib/duels/types'

const FORMATS: DuelFormat[] = ['1v1', '2v2', '1v2']

export default function DuelSetupModal({
    open,
    onClose,
    onCreate,
    onJoinCode,
    onQuickMatch,
    busy = false,
    error = '',
}: {
    open: boolean
    onClose: () => void
    onCreate: (format: DuelFormat, config: DuelConfig) => void
    onJoinCode: (code: string) => void
    onQuickMatch: (config: DuelConfig) => void
    busy?: boolean
    error?: string
}) {
    const [tab, setTab] = useState<'friend' | 'quick'>('friend')
    const [format, setFormat] = useState<DuelFormat>('1v1')
    const [config, setConfig] = useState<DuelConfig>(() => loadDuelConfig())
    const [code, setCode] = useState('')
    const [localError, setLocalError] = useState('')

    if (!open) return null

    const update = (next: DuelConfig) => {
        const visual = { ...next, game_mode: 'visual' as const }
        setConfig(visual)
        saveDuelConfig(visual)
    }

    const create = () => {
        setLocalError('')
        onCreate(format, { ...config, game_mode: 'visual' })
    }

    const join = () => {
        const next = code.trim().toUpperCase()
        if (next.length !== 6) {
            setLocalError('Enter the 6 character lobby code.')
            return
        }
        onJoinCode(next)
    }

    return (
        <div className='fixed inset-0 z-300 overflow-y-auto bg-black/40 p-4'>
            <div className='flex min-h-full items-center justify-center'>
                <div className='relative w-full max-w-lg rounded-md bg-white p-6 dark:bg-zinc-900'>
                    <button
                        type='button'
                        onClick={onClose}
                        className='absolute top-3 right-3 cursor-pointer px-2 text-xl text-gray-400'
                        aria-label='Close'
                    >
                        ×
                    </button>
                    <h2 className='mb-4 text-center text-2xl font-bold uppercase'>Duels</h2>
                    <div className='mb-4 grid grid-cols-2 gap-2'>
                        <button
                            type='button'
                            onClick={() => setTab('friend')}
                            className={`cursor-pointer border-2 px-3 py-2 font-medium ${
                                tab === 'friend'
                                    ? 'border-pink-500 bg-pink-500 text-white'
                                    : 'border-gray-200 dark:border-zinc-700'
                            }`}
                        >
                            Play a friend
                        </button>
                        <button
                            type='button'
                            onClick={() => setTab('quick')}
                            className={`cursor-pointer border-2 px-3 py-2 font-medium ${
                                tab === 'quick'
                                    ? 'border-pink-500 bg-pink-500 text-white'
                                    : 'border-gray-200 dark:border-zinc-700'
                            }`}
                        >
                            Quick match
                        </button>
                    </div>
                    {tab === 'friend' ? (
                        <>
                            <p className='mb-1 text-sm font-medium text-gray-700 dark:text-zinc-300'>Format</p>
                            <div className='mb-4 grid grid-cols-3 gap-2'>
                                {FORMATS.map((item) => (
                                    <button
                                        key={item}
                                        type='button'
                                        onClick={() => setFormat(item)}
                                        className={`cursor-pointer border-2 px-3 py-2 font-medium ${
                                            format === item
                                                ? 'border-pink-500 bg-pink-500 text-white'
                                                : 'border-gray-200 dark:border-zinc-700'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                ))}
                            </div>
                            <DuelConfigForm value={config} onChange={update} />
                            <button
                                type='button'
                                disabled={busy}
                                onClick={() => void create()}
                                className='mt-5 w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white hover:bg-pink-600 disabled:opacity-50'
                            >
                                Create lobby
                            </button>
                            <div className='mt-4'>
                                <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300'>
                                    Join with code
                                </label>
                                <div className='flex gap-2'>
                                    <input
                                        value={code}
                                        maxLength={6}
                                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                                        className='w-full border-2 border-gray-200 bg-white px-3 py-2 tracking-[0.3em] uppercase dark:border-zinc-700 dark:bg-zinc-950'
                                        placeholder='ABCDEF'
                                    />
                                    <button
                                        type='button'
                                        onClick={join}
                                        className='cursor-pointer rounded-full bg-zinc-900 px-4 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <DuelConfigForm value={config} onChange={update} />
                            <button
                                type='button'
                                onClick={() => onQuickMatch({ ...config, game_mode: 'visual' })}
                                className='mt-5 w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white hover:bg-pink-600'
                            >
                                Find opponent
                            </button>
                        </>
                    )}
                    {error || localError ? (
                        <p className='mt-3 text-sm text-red-600'>{error || localError}</p>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
