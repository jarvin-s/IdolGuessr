'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react'
import { getMyFeedbackTickets, type FeedbackTicket } from '@/lib/supabase'
import { useTicketLiveUpdates } from '@/hooks/useTicketLiveUpdates'
import {
    getStoredTickets,
    hasUnread,
    onFeedbackTicketsChanged,
    rememberTicket,
    type StoredTicket,
} from '@/utils/feedbackTickets'

interface FeedbackNoticeValue {
    unreadCount: number
    syncUnread: () => void
}

const FeedbackNoticeContext = createContext<FeedbackNoticeValue>({
    unreadCount: 0,
    syncUnread: () => {},
})

export function FeedbackNoticeProvider({ children }: { children: ReactNode }) {
    const [tickets, setTickets] = useState<FeedbackTicket[]>([])
    const [stored, setStored] = useState<StoredTicket[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const ticketsRef = useRef<FeedbackTicket[]>([])
    ticketsRef.current = tickets

    const applyTickets = useCallback((next: FeedbackTicket[]) => {
        ticketsRef.current = next
        setTickets(next)
        setUnreadCount(next.filter(hasUnread).length)
    }, [])

    const refresh = useCallback(async () => {
        const known = getStoredTickets()
        setStored(known)
        try {
            const data = await getMyFeedbackTickets(
                known.map(({ id, token }) => ({ id, token }))
            )
            for (const ticket of data) {
                if (ticket.token) rememberTicket(ticket.id, ticket.token)
            }
            setStored(getStoredTickets())
            applyTickets(data)
        } catch (err) {
            console.error('feedback notices', err)
        }
    }, [applyTickets])

    useEffect(() => {
        void refresh()
    }, [refresh])

    useEffect(() => onFeedbackTicketsChanged(() => {
        void refresh()
    }), [refresh])

    useTicketLiveUpdates(stored, () => {
        void refresh()
    }, true)

    const syncUnread = useCallback(() => {
        setUnreadCount(ticketsRef.current.filter(hasUnread).length)
    }, [])

    return (
        <FeedbackNoticeContext.Provider value={{ unreadCount, syncUnread }}>
            {children}
        </FeedbackNoticeContext.Provider>
    )
}

export function useFeedbackNotice() {
    return useContext(FeedbackNoticeContext)
}
