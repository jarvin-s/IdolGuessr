import type { TicketCategory, TicketStatus } from '@/lib/supabase'

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
    general: 'General',
    bug: 'Bug Report',
    feature: 'Feature Request',
    improvement: 'Improvement',
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
    open: 'Open',
    in_progress: 'In progress',
    resolved: 'Resolved',
    closed: 'Closed',
}

const STATUS_STYLES: Record<TicketStatus, string> = {
    open: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    resolved: 'bg-green-100 text-green-700',
    closed: 'bg-gray-200 text-gray-600',
}

export function StatusPill({ status }: { status: TicketStatus }) {
    return (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
        </span>
    )
}

export function formatTicketDate(iso: string): string {
    const date = new Date(iso)
    return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}
