import { useEffect, useState } from 'react'
import { getActiveAnnouncement, supabase, type Announcement } from '@/lib/supabase'

export function useLiveAnnouncement(): Announcement | null {
    const [announcement, setAnnouncement] = useState<Announcement | null>(null)

    useEffect(() => {
        let cancelled = false
        let request = 0

        const load = async () => {
            const current = ++request
            try {
                const next = await getActiveAnnouncement()
                if (!cancelled && current === request) setAnnouncement(next)
            } catch (err) {
                console.error('Error loading announcement:', err)
                if (!cancelled && current === request) setAnnouncement(null)
            }
        }

        load()
        const channel = supabase
            .channel('live-announcements')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
                load()
            })
            .subscribe((status) => {
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('Announcement realtime status:', status)
                }
            })

        return () => {
            cancelled = true
            supabase.removeChannel(channel)
        }
    }, [])

    return announcement
}
