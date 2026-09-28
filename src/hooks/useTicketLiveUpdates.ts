import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'

interface TicketRef {
    id: string
    token: string
}

export function useTicketLiveUpdates(
    tickets: TicketRef[],
    onUpdate: (ticketId: string) => void,
    enabled = true,
): void {
    const onUpdateRef = useRef(onUpdate)
    onUpdateRef.current = onUpdate

    const key = tickets
        .map((t) => `${t.id}:${t.token}`)
        .sort()
        .join(',')

    useEffect(() => {
        if (!enabled || !key) return
        const channels = key.split(',').map((entry) => {
            const [id, token] = entry.split(':')
            return supabase
                .channel(`feedback-ticket:${token}`)
                .on('broadcast', { event: 'ticket_updated' }, () => onUpdateRef.current(id))
                .subscribe()
        })
        return () => {
            channels.forEach((channel) => supabase.removeChannel(channel))
        }
    }, [key, enabled])
}
