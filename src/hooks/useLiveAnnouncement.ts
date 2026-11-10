import { useEffect, useState } from 'react'
import { getActiveAnnouncement, supabase, type Announcement } from '@/lib/supabase'
import { randomId } from '@/utils/randomId'

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
        // A new topic each mount. Reusing "live-announcements" returns the channel
        // React just closed, and subscribe() on that channel never joins.
        let active = true
        const channel = supabase
            .channel(`live-announcements-${randomId()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, () => {
                load()
            })
            .subscribe((status, err) => {
                if (!active) return
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error('Announcement realtime status:', status, err ?? '')
                }
            })

        return () => {
            cancelled = true
            active = false
            void supabase.removeChannel(channel)
        }
    }, [])

    return announcement
}
