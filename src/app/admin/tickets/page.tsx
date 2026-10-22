'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import localFont from 'next/font/local'
import {
    adminGetThread,
    adminListTickets,
    adminReply,
    adminSetStatus,
    supabase,
    type FeedbackThread,
    type FeedbackTicket,
    type TicketCategory,
    type TicketStatus,
} from '@/lib/supabase'
import TicketList from '@/components/feedback/TicketList'
import TicketThread from '@/components/feedback/TicketThread'
import {
    CATEGORY_LABELS,
    STATUS_LABELS,
    formatTicketNumber,
    resolveTicketNumber,
} from '@/components/feedback/ticketUi'

const proximaNovaBold = localFont({
    src: '../../../../public/fonts/proximanova_bold.otf',
})

function needsReply(ticket: FeedbackTicket): boolean {
    if (!ticket.last_user_message_at) return false
    if (ticket.status === 'closed') return false
    if (!ticket.last_admin_message_at) return true
    return (
        new Date(ticket.last_user_message_at).getTime() >
        new Date(ticket.last_admin_message_at).getTime()
    )
}

export default function AdminTicketsPage() {
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>(
        'all'
    )
    const [categoryFilter, setCategoryFilter] = useState<
        TicketCategory | 'all'
    >('all')
    const [tickets, setTickets] = useState<FeedbackTicket[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [thread, setThread] = useState<FeedbackThread | null>(null)
    const [threadError, setThreadError] = useState<string | null>(null)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

    const loadTickets = useCallback(async () => {
        setIsLoading(true)
        setError(null)
        try {
            setTickets(await adminListTickets(statusFilter))
        } catch (err) {
            console.error('Error loading tickets:', err)
            setError('Could not load tickets.')
        } finally {
            setIsLoading(false)
        }
    }, [statusFilter])

    const selectedIdRef = useRef<string | null>(null)
    selectedIdRef.current = selectedId
    const loadTicketsRef = useRef(loadTickets)
    loadTicketsRef.current = loadTickets

    const loadThread = useCallback(async (ticketId: string) => {
        setThreadError(null)
        try {
            const data = await adminGetThread(ticketId)
            if (selectedIdRef.current === ticketId) setThread(data)
        } catch (err) {
            console.error('Error loading thread:', err)
            setThreadError('Could not load this ticket.')
        }
    }, [])

    useEffect(() => {
        loadTickets()
    }, [loadTickets])

    useEffect(() => {
        const channel = supabase
            .channel('admin-feedback-tickets')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'feedback_tickets' },
                (payload) => {
                    loadTicketsRef.current()
                    const changedId =
                        (payload.new as Partial<FeedbackTicket> | null)?.id ??
                        (payload.old as Partial<FeedbackTicket> | null)?.id
                    if (changedId && changedId === selectedIdRef.current)
                        loadThread(changedId)
                }
            )
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadThread])

    const visibleTickets = useMemo(
        () =>
            categoryFilter === 'all'
                ? tickets
                : tickets.filter((t) => t.category === categoryFilter),
        [tickets, categoryFilter]
    )

    const awaitingReply = tickets.filter(needsReply).length
    const activeTicketNumber = thread
        ? resolveTicketNumber(thread.ticket, tickets)
        : null
    const activeTicketNumberLabel = formatTicketNumber(activeTicketNumber)

    const selectTicket = (ticket: FeedbackTicket) => {
        selectedIdRef.current = ticket.id
        setSelectedId(ticket.id)
        setThread(null)
        loadThread(ticket.id)
    }

    const clearSelection = () => {
        selectedIdRef.current = null
        setSelectedId(null)
        setThread(null)
        setThreadError(null)
    }

    const showThreadOnMobile = selectedId !== null

    const handleReply = async (body: string) => {
        if (!thread) return
        await adminReply(thread.ticket.id, body)
        await Promise.all([loadThread(thread.ticket.id), loadTickets()])
    }

    const handleStatus = async (status: TicketStatus) => {
        if (!thread) return
        setIsUpdatingStatus(true)
        try {
            await adminSetStatus(thread.ticket.id, status)
            await Promise.all([loadThread(thread.ticket.id), loadTickets()])
        } catch (err) {
            console.error('Error updating status:', err)
            setThreadError('Could not update status.')
        } finally {
            setIsUpdatingStatus(false)
        }
    }

    return (
        <div className='grid min-w-0 gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'>
            <section
                className={`min-w-0 rounded-lg bg-white p-3 shadow-sm sm:p-4 dark:bg-zinc-900 ${showThreadOnMobile ? 'hidden md:block' : ''}`}
            >
                <div className='mb-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center'>
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as TicketStatus | 'all'
                            )
                        }
                        className='w-full rounded-md border border-gray-300 px-2 py-2 text-base sm:w-auto sm:py-1.5 sm:text-sm dark:border-zinc-600 dark:bg-zinc-800'
                    >
                        <option value='all'>All statuses</option>
                        {(Object.keys(STATUS_LABELS) as TicketStatus[]).map(
                            (key) => (
                                <option key={key} value={key}>
                                    {STATUS_LABELS[key]}
                                </option>
                            )
                        )}
                    </select>
                    <select
                        value={categoryFilter}
                        onChange={(e) =>
                            setCategoryFilter(
                                e.target.value as TicketCategory | 'all'
                            )
                        }
                        className='w-full rounded-md border border-gray-300 px-2 py-2 text-base sm:w-auto sm:py-1.5 sm:text-sm dark:border-zinc-600 dark:bg-zinc-800'
                    >
                        <option value='all'>All categories</option>
                        {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map(
                            (key) => (
                                <option key={key} value={key}>
                                    {CATEGORY_LABELS[key]}
                                </option>
                            )
                        )}
                    </select>
                    <button
                        onClick={loadTickets}
                        className='cursor-pointer rounded-full bg-gray-100 px-3 py-2 text-base transition-colors hover:bg-gray-200 sm:ml-auto sm:py-1.5 sm:text-sm dark:bg-zinc-800 dark:hover:bg-zinc-700'
                    >
                        Refresh
                    </button>
                </div>
                <p className='mb-3 text-xs text-gray-500 dark:text-zinc-400'>
                    {awaitingReply} ticket{awaitingReply === 1 ? '' : 's'}{' '}
                    awaiting your reply (marked with a dot)
                </p>
                <div className='max-h-[calc(100dvh-14rem)] overflow-y-auto md:max-h-[70vh]'>
                    <TicketList
                        tickets={visibleTickets}
                        allTicketsForNumbering={tickets}
                        isLoading={isLoading}
                        error={error}
                        isUnread={needsReply}
                        onSelect={selectTicket}
                        selectedId={selectedId}
                        emptyMessage='No tickets match these filters.'
                    />
                </div>
            </section>

            <section
                className={`flex min-w-0 flex-col rounded-lg bg-white p-3 shadow-sm sm:p-4 dark:bg-zinc-900 ${
                    showThreadOnMobile
                        ? 'min-h-[calc(100dvh-8rem)] md:min-h-[60vh]'
                        : 'hidden md:flex md:min-h-[60vh]'
                }`}
            >
                {showThreadOnMobile && (
                    <button
                        type='button'
                        onClick={clearSelection}
                        className='mb-3 flex cursor-pointer items-center gap-2 self-start rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-200 md:hidden dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    >
                        ← Back to tickets
                    </button>
                )}
                {!selectedId ? (
                    <p className='m-auto hidden text-sm text-gray-500 md:block dark:text-zinc-400'>
                        Select a ticket to view the conversation.
                    </p>
                ) : threadError && !thread ? (
                    <p className='m-auto text-sm text-red-600'>{threadError}</p>
                ) : !thread ? (
                    <p className='m-auto text-sm text-gray-500 dark:text-zinc-400'>
                        Loading ticket...
                    </p>
                ) : (
                    <>
                        <div className='mb-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between'>
                            <h2
                                className={`${proximaNovaBold.className} min-w-0 flex-1 text-base break-words sm:text-lg`}
                            >
                                {activeTicketNumberLabel && (
                                    <span className='mr-2 font-mono text-base font-normal text-gray-500 dark:text-zinc-400'>
                                        {activeTicketNumberLabel}
                                    </span>
                                )}
                                {thread.ticket.subject}
                            </h2>
                            <div className='flex flex-wrap gap-2'>
                                <StatusButtons
                                    current={thread.ticket.status}
                                    disabled={isUpdatingStatus}
                                    onChange={handleStatus}
                                />
                            </div>
                        </div>
                        {threadError && (
                            <p className='mb-2 text-sm text-red-600'>
                                {threadError}
                            </p>
                        )}
                        <div className='flex min-h-0 flex-1 flex-col md:h-[60vh]'>
                            <TicketThread
                                thread={thread}
                                viewer='admin'
                                onSend={handleReply}
                                canReply
                                ticketNumber={activeTicketNumber}
                            />
                        </div>
                    </>
                )}
            </section>
        </div>
    )
}

function StatusButtons({
    current,
    disabled,
    onChange,
}: {
    current: TicketStatus
    disabled: boolean
    onChange: (status: TicketStatus) => void
}) {
    const actions: { status: TicketStatus; label: string }[] =
        current === 'resolved' || current === 'closed'
            ? [{ status: 'open', label: 'Reopen' }]
            : [
                  ...(current === 'open'
                      ? [
                            {
                                status: 'in_progress' as const,
                                label: 'In progress',
                            },
                        ]
                      : []),
                  { status: 'resolved', label: 'Resolve' },
              ]
    if (current !== 'closed') actions.push({ status: 'closed', label: 'Close' })

    return (
        <>
            {actions.map(({ status, label }) => (
                <button
                    key={status}
                    onClick={() => onChange(status)}
                    disabled={disabled}
                    className={`cursor-pointer rounded-full px-3 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        status === 'resolved'
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : status === 'closed'
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-600'
                              : 'bg-pink-500 text-white hover:bg-pink-600'
                    }`}
                >
                    {label}
                </button>
            ))}
        </>
    )
}
