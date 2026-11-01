import { useCallback, useEffect, useState } from 'react'
import { getMyFeedbackTickets } from '@/lib/supabase'
import { getStoredTickets, hasUnread, rememberTicket, type StoredTicket } from '@/utils/feedbackTickets'
import { useTicketLiveUpdates } from './useTicketLiveUpdates'

export function useFeedbackUnread(enabled: boolean): number {
    const [unreadCount, setUnreadCount] = useState(0)
    const [storedTickets, setStoredTickets] = useState<StoredTicket[]>([])

    const refresh = useCallback(async () => {
        const stored = getStoredTickets()
        setStoredTickets(stored)
        try {
            const tickets = await getMyFeedbackTickets(stored.map(({ id, token }) => ({ id, token })))
            tickets.forEach((ticket) => {
                if (ticket.token) rememberTicket(ticket.id, ticket.token)
            })
            if (stored.length === 0) setStoredTickets(getStoredTickets())
            setUnreadCount(tickets.filter(hasUnread).length)
        } catch {
            setUnreadCount(0)
        }
    }, [])

    useEffect(() => {
        if (enabled) refresh()
    }, [enabled, refresh])

    useTicketLiveUpdates(storedTickets, refresh, enabled)

    return unreadCount
}
