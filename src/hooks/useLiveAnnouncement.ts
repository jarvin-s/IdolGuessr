import { useEffect, useState } from 'react'
import { getActiveAnnouncement, supabase, type Announcement } from '@/lib/supabase'

const listeners = new Set<(announcement: Announcement | null) => void>()
let channelStarted = false

// One public broadcast channel per tab, kept open for the page's lifetime.
// Removing and re-creating a topic returns the closing channel, which never
// rejoins, and Postgres Changes would cost a database query per subscriber.
function listenForAnnouncements() {
    if (channelStarted) return
    channelStarted = true
    supabase
        .channel('announcements')
        .on('broadcast', { event: 'announcement' }, ({ payload }) => {
            const next = (payload as { announcement?: Announcement | null } | undefined)?.announcement ?? null
            listeners.forEach((listener) => listener(next))
        })
        .subscribe((status, err) => {
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.error('Announcement realtime status:', status, err ?? '')
            }
        })
}

export function useLiveAnnouncement(): Announcement | null {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null)

    useEffect(() => {
        let cancelled = false
        let live = false

        const onBroadcast = (next: Announcement | null) => {
            live = true
            if (!cancelled) setAnnouncement(next)
        }
        listeners.add(onBroadcast)
        listenForAnnouncements()

        getActiveAnnouncement()
            .then((next) => {
                if (!cancelled && !live) setAnnouncement(next)
            })
            .catch((err) => {
                console.error('Error loading announcement:', err)
            })

        return () => {
            cancelled = true
            listeners.delete(onBroadcast)
        }
    }, [])

    return announcement
}
