import type { FeedbackTicket } from '@/lib/supabase'
import {
    CATEGORY_LABELS,
    StatusPill,
    formatTicketDate,
    formatTicketNumber,
    resolveTicketNumber,
} from './ticketUi'

interface TicketListProps {
    tickets: FeedbackTicket[]
    isLoading: boolean
    error: string | null
    isUnread: (ticket: FeedbackTicket) => boolean
    onSelect: (ticket: FeedbackTicket) => void
    emptyMessage?: string
    selectedId?: string | null
    allTicketsForNumbering?: FeedbackTicket[]
}

export default function TicketList({
    tickets,
    isLoading,
    error,
    isUnread,
    onSelect,
    emptyMessage = 'No tickets yet.',
    selectedId,
    allTicketsForNumbering,
}: TicketListProps) {
    const numberingTickets = allTicketsForNumbering ?? tickets
    if (isLoading && tickets.length === 0) {
        return <p className='py-6 text-center text-sm text-gray-500'>Loading tickets...</p>
    }
    if (error) {
        return <p className='py-6 text-center text-sm text-red-600'>{error}</p>
    }
    if (tickets.length === 0) {
        return <p className='py-6 text-center text-sm text-gray-500'>{emptyMessage}</p>
    }

    return (
        <ul className='space-y-2'>
            {tickets.map((ticket) => {
                const unread = isUnread(ticket)
                const selected = ticket.id === selectedId
                const ticketNumberLabel = formatTicketNumber(resolveTicketNumber(ticket, numberingTickets))
                return (
                    <li key={ticket.id}>
                        <button
                            onClick={() => onSelect(ticket)}
                            className={`flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-gray-50 ${
                                selected ? 'border-pink-400 bg-pink-50' : 'border-gray-200'
                            }`}
                        >
                            <span
                                className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${unread ? 'bg-pink-500' : 'bg-transparent'}`}
                                aria-label={unread ? 'New reply' : undefined}
                            />
                            <div className='min-w-0 flex-1'>
                                <p className={`truncate text-sm ${unread ? 'font-semibold text-black' : 'text-gray-800'}`}>
                                    {ticketNumberLabel && (
                                        <span className='mr-2 font-mono text-xs text-gray-500'>
                                            {ticketNumberLabel}
                                        </span>
                                    )}
                                    {ticket.subject}
                                </p>
                                <div className='mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500'>
                                    <StatusPill status={ticket.status} />
                                    <span>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
                                    <span>{formatTicketDate(ticket.updated_at)}</span>
                                </div>
                            </div>
                        </button>
                    </li>
                )
            })}
        </ul>
    )
}
