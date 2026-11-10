import { claimFeedbackTickets, type FeedbackTicket } from '@/lib/supabase'
import { getProfile } from '@/lib/player'

const STORAGE_KEY = 'idol-guessr-feedback-tickets'
const memory = new Map<string, StoredTicket>()

export interface StoredTicket {
    id: string
    token: string
    lastSeenAdminAt: string | null
}

function readLegacyTickets(): StoredTicket[] {
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

export function rememberTicket(id: string, token: string): void {
    const existing = memory.get(id)
    memory.set(id, {
        id,
        token,
        lastSeenAdminAt: existing?.lastSeenAdminAt ?? null,
    })
}

function writeBrowserTickets(tickets: StoredTicket[]): void {
    if (typeof window === 'undefined') return
    if (tickets.length === 0) {
        localStorage.removeItem(STORAGE_KEY)
        return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
}

export function getStoredTickets(): StoredTicket[] {
    for (const ticket of readLegacyTickets()) {
        if (!memory.has(ticket.id)) memory.set(ticket.id, ticket)
    }
    return [...memory.values()]
}

export function addStoredTicket(id: string, token: string): void {
    rememberTicket(id, token)
    const next = readLegacyTickets().filter((ticket) => ticket.id !== id)
    next.push({
        id,
        token,
        lastSeenAdminAt: memory.get(id)?.lastSeenAdminAt ?? null,
    })
    writeBrowserTickets(next)
}

function removeBrowserTickets(ids: Set<string>): void {
    if (ids.size === 0) return
    writeBrowserTickets(readLegacyTickets().filter((ticket) => !ids.has(ticket.id)))
}

export async function claimAccountFeedbackTickets(): Promise<void> {
    const profile = getProfile()
    if (!profile || profile.is_anonymous) return
    const stored = readLegacyTickets()
    if (stored.length === 0) return
    try {
        const claimed = await claimFeedbackTickets(
            stored.map(({ id, token }) => ({ id, token }))
        )
        removeBrowserTickets(new Set(claimed))
    } catch (err) {
        console.error('claim_feedback_tickets', err)
    }
}

export function getTicketToken(id: string): string | null {
    return getStoredTickets().find((ticket) => ticket.id === id)?.token ?? null
}

export function markSeen(id: string, lastAdminMessageAt: string | null): void {
    if (!lastAdminMessageAt) return
    const current = memory.get(id)
    if (current) memory.set(id, { ...current, lastSeenAdminAt: lastAdminMessageAt })
}

function seenAtFor(id: string): string | null {
    const fromMemory = memory.get(id)?.lastSeenAdminAt ?? null
    const reads = getProfile()?.seen_notices?.feedback_reads
    const fromProfile =
        reads && typeof reads === 'object' && !Array.isArray(reads)
            ? (reads as Record<string, unknown>)[id]
            : null
    const profileAt = typeof fromProfile === 'string' ? fromProfile : null
    if (!fromMemory) return profileAt
    if (!profileAt) return fromMemory
    return new Date(fromMemory).getTime() > new Date(profileAt).getTime() ? fromMemory : profileAt
}

export function hasUnread(ticket: Pick<FeedbackTicket, 'id' | 'last_admin_message_at'>): boolean {
    if (!ticket.last_admin_message_at) return false
    const seen = seenAtFor(ticket.id)
    if (!seen) return true
    return new Date(ticket.last_admin_message_at).getTime() > new Date(seen).getTime()
}
