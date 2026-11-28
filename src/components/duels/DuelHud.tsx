'use client'

import HealthBar from '@/components/duels/HealthBar'
import MultiplierBadge from '@/components/duels/MultiplierBadge'
import PlayerBadge from '@/components/duels/PlayerBadge'
import RoundTimer from '@/components/duels/RoundTimer'
import type { DuelPlayer } from '@/lib/duels/types'

export default function DuelHud({
    players,
    myTeam,
    teamHp,
    secondsLeft,
    multiplier,
    roundNo,
    onlineIds,
    reconnecting = false,
    correctIds,
    doneIds,
    pressured,
    shakeTeam,
}: {
    players: DuelPlayer[]
    myTeam: 1 | 2
    teamHp: [number, number]
    secondsLeft: number
    multiplier: number
    roundNo: number
    onlineIds: string[]
    reconnecting?: boolean
    correctIds: string[]
    doneIds: string[]
    pressured: boolean
    shakeTeam: 1 | 2 | null
}) {
    const mine = players.filter((player) => player.team === myTeam)
    const theirs = players.filter((player) => player.team !== myTeam)
    const myHp = myTeam === 1 ? teamHp[0] : teamHp[1]
    const theirHp = myTeam === 1 ? teamHp[1] : teamHp[0]

    const badges = (list: DuelPlayer[]) =>
        list.map((player) => (
            <PlayerBadge
                key={player.user_id}
                player={player}
                online={onlineIds.includes(player.user_id)}
                done={doneIds.includes(player.user_id)}
                correct={correctIds.includes(player.user_id)}
            />
        ))

    return (
        <div className='grid grid-cols-[1fr_auto_1fr] items-start gap-3'>
            <div className='space-y-2'>
                <HealthBar hp={myHp} side='left' tone='me' shake={shakeTeam === myTeam} />
                {badges(mine)}
            </div>
            <div className='flex flex-col items-center gap-1 px-2'>
                <p className='text-[10px] font-bold tracking-wide text-zinc-500 uppercase'>Round {roundNo}</p>
                <RoundTimer secondsLeft={secondsLeft} pressured={pressured} />
                <MultiplierBadge multiplier={multiplier} />
                {reconnecting ? (
                    <p className='text-[10px] font-semibold text-amber-600'>Reconnecting...</p>
                ) : null}
            </div>
            <div className='space-y-2'>
                <HealthBar hp={theirHp} side='right' tone='opponent' shake={shakeTeam !== null && shakeTeam !== myTeam} />
                <div className='flex flex-col items-end'>{badges(theirs)}</div>
            </div>
        </div>
    )
}
