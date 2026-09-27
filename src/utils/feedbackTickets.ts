import type { FeedbackTicket } from '@/lib/supabase'

const STORAGE_KEY = 'idol-guessr-feedback-tickets'

export interface StoredTicket {
    id: string
    token: string
    lastSeenAdminAt: string | null
}

export function getStoredTickets(): StoredTicket[] {
    if (typeof window === 'undefined') return []
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed.filter(
            (t): t is StoredTicket => typeof t?.id === 'string' && typeof t?.token === 'string',
        )
    } catch {
        return []
    }
}

function saveStoredTickets(tickets: StoredTicket[]): void {
    if (typeof window === 'undefined') return
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
    } catch {
        // Storage full or unavailable
    }
}

export function addStoredTicket(id: string, token: string): void {
    const tickets = getStoredTickets().filter((t) => t.id !== id)
    tickets.unshift({ id, token, lastSeenAdminAt: null })
    saveStoredTickets(tickets)
}

export function getTicketToken(id: string): string | null {
    return getStoredTickets().find((t) => t.id === id)?.token ?? null
}

export function markSeen(id: string, lastAdminMessageAt: string | null): void {
    if (!lastAdminMessageAt) return
    const tickets = getStoredTickets().map((t) =>
        t.id === id ? { ...t, lastSeenAdminAt: lastAdminMessageAt } : t,
    )
    saveStoredTickets(tickets)
}

export function hasUnread(ticket: Pick<FeedbackTicket, 'id' | 'last_admin_message_at'>): boolean {
    if (!ticket.last_admin_message_at) return false
    const stored = getStoredTickets().find((t) => t.id === ticket.id)
    if (!stored) return false
    if (!stored.lastSeenAdminAt) return true
    return new Date(ticket.last_admin_message_at).getTime() > new Date(stored.lastSeenAdminAt).getTime()
}
