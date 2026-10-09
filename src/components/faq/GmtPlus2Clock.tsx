'use client'

import { useEffect, useState } from 'react'

function formatAmsterdamTime(date: Date): string {
    return new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/Amsterdam',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(date)
}

export default function GmtPlus2Clock() {
    const [time, setTime] = useState<string | null>(null)

    useEffect(() => {
        const update = () => setTime(formatAmsterdamTime(new Date()))
        update()
        const id = setInterval(update, 1000)
        return () => clearInterval(id)
    }, [])

    return (
        <span className='font-medium text-gray-900 tabular-nums'>
            {time ?? '--:--:--'}
        </span>
    )
}
