'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import DuelLobby from '@/components/duels/DuelLobby'
import { joinDuelLobby } from '@/lib/duels/api'
import { duelErrorMessage } from '@/lib/duels/errors'
import { useDuelLobby } from '@/hooks/useDuelLobby'

export default function DuelLobbyPage() {
    const params = useParams()
    const code = String(params.code ?? '').toUpperCase()
    const [joined, setJoined] = useState(false)
    const [joinError, setJoinError] = useState('')
    const lobby = useDuelLobby(joined ? code : '')

    useEffect(() => {
        if (!code) return
        let cancelled = false
        void joinDuelLobby(code)
            .then(() => {
                if (!cancelled) setJoined(true)
            })
            .catch((error) => {
                if (!cancelled) setJoinError(duelErrorMessage(error))
            })
        return () => {
            cancelled = true
        }
    }, [code])

    if (joinError || lobby.error) {
        return (
            <main className='mx-auto max-w-lg px-4 py-16 text-center'>
                <p>{joinError || lobby.error}</p>
                <Link href='/duels' className='mt-4 inline-block underline'>
                    Back to Duels
                </Link>
            </main>
        )
    }

    if (!lobby.lobby) {
        return <main className='px-4 py-16 text-center text-sm text-zinc-500'>Joining lobby…</main>
    }

    return (
        <main className='mx-auto min-h-screen max-w-lg px-4 py-8'>
            <DuelLobby
                lobby={lobby.lobby}
                myId={lobby.myId}
                isHost={lobby.isHost}
                onlineIds={lobby.onlineIds}
                canStart={lobby.canStart}
                onChangeConfig={(config) => void lobby.changeConfig(config)}
                onChangeFormat={(format) => void lobby.changeFormat(format)}
                onMove={(userId, team) => void lobby.move(userId, team)}
                onKick={(userId) => void lobby.kick(userId)}
                onStart={() => void lobby.start()}
                onLeave={() => void lobby.leave()}
            />
        </main>
    )
}
