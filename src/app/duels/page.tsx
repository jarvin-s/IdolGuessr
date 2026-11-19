'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import DuelSetupModal from '@/components/duels/DuelSetupModal'
import QueueScreen from '@/components/duels/QueueScreen'
import { createDuelLobby } from '@/lib/duels/api'
import { duelErrorMessage } from '@/lib/duels/errors'
import { useDuelQueue } from '@/hooks/useDuelQueue'
import type { DuelConfig, DuelFormat } from '@/lib/duels/types'

function DuelsHub() {
    const router = useRouter()
    const params = useSearchParams()
    const queue = useDuelQueue()
    const [open, setOpen] = useState(true)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const code = params.get('code')

    useEffect(() => {
        if (!code) return
        router.replace(`/duels/${code.trim().toUpperCase()}`)
    }, [code, router])

    const create = async (format: DuelFormat, config: DuelConfig) => {
        setBusy(true)
        setError('')
        try {
            const lobby = await createDuelLobby(format, config)
            router.push(`/duels/${lobby.code}`)
        } catch (err) {
            setError(duelErrorMessage(err))
            setBusy(false)
        }
    }

    return (
        <main className='mx-auto min-h-screen max-w-lg px-4 py-8'>
            <div className='mb-6 flex items-center justify-between'>
                <Link href='/' className='text-sm underline'>
                    Back
                </Link>
                <h1 className='text-xl font-bold uppercase'>Duels</h1>
                <Link href='/leaderboard?tab=duels' className='text-sm underline'>
                    Leaderboard
                </Link>
            </div>
            {queue.searching && queue.config ? (
                <QueueScreen
                    config={queue.config}
                    elapsedSeconds={queue.elapsedSeconds}
                    onCancel={queue.leave}
                />
            ) : (
                <div className='rounded-md border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-700'>
                    <p className='text-sm text-zinc-500'>Invite a friend or jump into a 1v1.</p>
                    <button
                        type='button'
                        onClick={() => setOpen(true)}
                        className='mt-4 cursor-pointer rounded-full bg-pink-500 px-4 py-2 text-white'
                    >
                        Play
                    </button>
                </div>
            )}
            {queue.error ? <p className='mt-3 text-sm text-red-600'>{queue.error}</p> : null}
            <DuelSetupModal
                open={open && !queue.searching}
                onClose={() => {
                    setOpen(false)
                    router.push('/')
                }}
                onCreate={(format, config) => void create(format, config)}
                onJoinCode={(next) => router.push(`/duels/${next}`)}
                onQuickMatch={(config) => {
                    setOpen(false)
                    void queue.join(config)
                }}
                busy={busy}
                error={error}
            />
        </main>
    )
}

export default function DuelsPage() {
    return (
        <Suspense>
            <DuelsHub />
        </Suspense>
    )
}
