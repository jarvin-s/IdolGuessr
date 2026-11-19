'use client'

import { useState } from 'react'
import DuelConfigForm from '@/components/duels/DuelConfigForm'
import { loadDuelConfig, saveDuelConfig } from '@/lib/duels/config'
import type { DuelConfig, DuelFormat } from '@/lib/duels/types'

const FORMATS: DuelFormat[] = ['1v1', '2v2', '1v2']

export default function DuelSetupModal({
    open,
    mode,
    onClose,
    onCreate,
    onQuickMatch,
    busy = false,
    error = '',
}: {
    open: boolean
    mode: 'create' | 'quick'
    onClose: () => void
    onCreate: (format: DuelFormat, config: DuelConfig) => void
    onQuickMatch: (config: DuelConfig) => void
    busy?: boolean
    error?: string
}) {
    const [format, setFormat] = useState<DuelFormat>('1v1')
    const [config, setConfig] = useState<DuelConfig>(() => loadDuelConfig())

    if (!open) return null

    const update = (next: DuelConfig) => {
        const visual = { ...next, game_mode: 'visual' as const }
        setConfig(visual)
        saveDuelConfig(visual)
    }

    const visualConfig = { ...config, game_mode: 'visual' as const }

    return (
        <div className='fixed inset-0 z-600 overflow-y-auto bg-black/40 px-4'>
            <div className='flex min-h-full items-center justify-center py-8'>
                <div
                    className='modal-fade-in relative w-full max-w-lg rounded-2xl bg-white p-6 text-center shadow-xl dark:bg-zinc-900'
                    role='dialog'
                    aria-modal='true'
                    aria-labelledby='duel-setup-title'
                >
                    <button
                        type='button'
                        onClick={onClose}
                        className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        aria-label='Back'
                    >
                        <CloseIcon />
                    </button>
                    <h2 id='duel-setup-title' className='text-2xl font-bold'>
                        {mode === 'create' ? 'Create lobby' : 'Quick match'}
                    </h2>
                    <p className='mt-2 text-base text-gray-500 dark:text-zinc-400'>
                        {mode === 'create'
                            ? 'Pick a format and the idols you want to play'
                            : 'Pick the idols, then wait for an opponent'}
                    </p>
                    <div className='mt-6 text-left'>
                        {mode === 'create' ? (
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
                            </>
                        ) : null}
                        <DuelConfigForm value={config} onChange={update} />
                    </div>
                    <button
                        type='button'
                        disabled={busy}
                        onClick={() =>
                            mode === 'create' ? onCreate(format, visualConfig) : onQuickMatch(visualConfig)
                        }
                        className='mt-5 flex w-full cursor-pointer items-center justify-center rounded-full bg-pink-600 px-4 py-1.5 font-semibold text-white transition-colors hover:bg-pink-700 disabled:opacity-50'
                    >
                        {mode === 'create' ? 'Create lobby' : 'Find opponent'}
                    </button>
                    {error ? <p className='mt-3 text-sm text-red-600'>{error}</p> : null}
                </div>
            </div>
        </div>
    )
}

function CloseIcon() {
    return (
        <svg className='h-4 w-4 text-gray-600 dark:text-zinc-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
        </svg>
    )
}
