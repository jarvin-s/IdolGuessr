'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import localFont from 'next/font/local'
import type { Session } from '@supabase/supabase-js'
import {
    adminGetThread,
    adminListTickets,
    adminReply,
    adminSetStatus,
    checkIsAdmin,
    signInAdmin,
    signOutAdmin,
    supabase,
    type FeedbackThread,
    type FeedbackTicket,
    type TicketCategory,
    type TicketStatus,
} from '@/lib/supabase'
import TicketList from '@/components/feedback/TicketList'
import TicketThread from '@/components/feedback/TicketThread'
import { CATEGORY_LABELS, STATUS_LABELS } from '@/components/feedback/ticketUi'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

type AuthState = 'loading' | 'signed-out' | 'unauthorized' | 'admin'

function needsReply(ticket: FeedbackTicket): boolean {
    if (!ticket.last_user_message_at) return false
    if (ticket.status === 'closed') return false
    if (!ticket.last_admin_message_at) return true
    return new Date(ticket.last_user_message_at).getTime() > new Date(ticket.last_admin_message_at).getTime()
}

export default function AdminPage() {
    const [session, setSession] = useState<Session | null | undefined>(undefined)
    const [authState, setAuthState] = useState<AuthState>('loading')

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))
        const { data } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession)
        })
        return () => data.subscription.unsubscribe()
    }, [])

    const userId = session === undefined ? undefined : (session?.user.id ?? null)

    useEffect(() => {
        if (userId === undefined) return
        if (!userId) {
            setAuthState('signed-out')
            return
        }
        setAuthState('loading')
        let cancelled = false
        checkIsAdmin()
            .then((isAdmin) => {
                if (!cancelled) setAuthState(isAdmin ? 'admin' : 'unauthorized')
            })
            .catch(() => {
                if (!cancelled) setAuthState('unauthorized')
            })
        return () => {
            cancelled = true
        }
    }, [userId])

    return (
        <main className='min-h-screen bg-gray-50 p-4 sm:p-8'>
            <div className='mx-auto max-w-6xl'>
                <header className='mb-6 flex items-center justify-between'>
                    <h1 className={`${proximaNovaBold.className} text-2xl uppercase`}>Feedback tickets</h1>
                    {session && (
                        <div className='flex items-center gap-3 text-sm text-gray-600'>
                            <span className='hidden sm:inline'>{session.user.email}</span>
                            <button
                                onClick={() => signOutAdmin()}
                                className='cursor-pointer rounded-full bg-gray-200 px-3 py-1.5 transition-colors hover:bg-gray-300'
                            >
                                Sign out
                            </button>
                        </div>
                    )}
                </header>

                {authState === 'loading' && <p className='text-gray-500'>Loading...</p>}
                {authState === 'signed-out' && <LoginForm />}
                {authState === 'unauthorized' && (
                    <div className='rounded-lg bg-white p-6 text-center shadow-sm'>
                        <p className='text-gray-700'>Not authorized. This account is not registered as an admin.</p>
                    </div>
                )}
                {authState === 'admin' && <AdminDashboard />}
            </div>
        </main>
    )
}

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)
        try {
            await signInAdmin(email.trim(), password)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign in failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className='mx-auto max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-sm'>
            <h2 className={`${proximaNovaBold.className} text-lg uppercase`}>Sign in</h2>
            <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Email'
                autoComplete='email'
                required
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none'
            />
            <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Password'
                autoComplete='current-password'
                required
                className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none'
            />
            {error && <p className='text-sm text-red-600'>{error}</p>}
            <button
                type='submit'
                disabled={isSubmitting}
                className='w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
            >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
        </form>
    )
}

function AdminDashboard() {
    const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
    const [categoryFilter, setCategoryFilter] = useState<TicketCategory | 'all'>('all')
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
            .on('postgres_changes', { event: '*', schema: 'public', table: 'feedback_tickets' }, (payload) => {
                loadTicketsRef.current()
                const changedId =
                    (payload.new as Partial<FeedbackTicket> | null)?.id ??
                    (payload.old as Partial<FeedbackTicket> | null)?.id
                if (changedId && changedId === selectedIdRef.current) loadThread(changedId)
            })
            .subscribe()
        return () => {
            supabase.removeChannel(channel)
        }
    }, [loadThread])

    const visibleTickets = useMemo(
        () => (categoryFilter === 'all' ? tickets : tickets.filter((t) => t.category === categoryFilter)),
        [tickets, categoryFilter],
    )

    const awaitingReply = tickets.filter(needsReply).length

    const selectTicket = (ticket: FeedbackTicket) => {
        selectedIdRef.current = ticket.id
        setSelectedId(ticket.id)
        setThread(null)
        loadThread(ticket.id)
    }

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
        <div className='grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'>
            <section className='rounded-lg bg-white p-4 shadow-sm'>
                <div className='mb-3 flex flex-wrap items-center gap-2'>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as TicketStatus | 'all')}
                        className='rounded-md border border-gray-300 px-2 py-1.5 text-sm'
                    >
                        <option value='all'>All statuses</option>
                        {(Object.keys(STATUS_LABELS) as TicketStatus[]).map((key) => (
                            <option key={key} value={key}>
                                {STATUS_LABELS[key]}
                            </option>
                        ))}
                    </select>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value as TicketCategory | 'all')}
                        className='rounded-md border border-gray-300 px-2 py-1.5 text-sm'
                    >
                        <option value='all'>All categories</option>
                        {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((key) => (
                            <option key={key} value={key}>
                                {CATEGORY_LABELS[key]}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={loadTickets}
                        className='ml-auto cursor-pointer rounded-full bg-gray-100 px-3 py-1.5 text-sm transition-colors hover:bg-gray-200'
                    >
                        Refresh
                    </button>
                </div>
                <p className='mb-3 text-xs text-gray-500'>
                    {awaitingReply} ticket{awaitingReply === 1 ? '' : 's'} awaiting your reply (marked with a dot)
                </p>
                <div className='max-h-[70vh] overflow-y-auto'>
                    <TicketList
                        tickets={visibleTickets}
                        isLoading={isLoading}
                        error={error}
                        isUnread={needsReply}
                        onSelect={selectTicket}
                        selectedId={selectedId}
                        emptyMessage='No tickets match these filters.'
                    />
                </div>
            </section>

            <section className='flex min-h-[60vh] flex-col rounded-lg bg-white p-4 shadow-sm'>
                {!selectedId ? (
                    <p className='m-auto text-sm text-gray-500'>Select a ticket to view the conversation.</p>
                ) : threadError && !thread ? (
                    <p className='m-auto text-sm text-red-600'>{threadError}</p>
                ) : !thread ? (
                    <p className='m-auto text-sm text-gray-500'>Loading ticket...</p>
                ) : (
                    <>
                        <div className='mb-3 flex flex-wrap items-start justify-between gap-2'>
                            <h2 className={`${proximaNovaBold.className} min-w-0 flex-1 text-lg break-words`}>
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
                        {threadError && <p className='mb-2 text-sm text-red-600'>{threadError}</p>}
                        <div className='flex h-[60vh] flex-col'>
                            <TicketThread
                                thread={thread}
                                viewer='admin'
                                onSend={handleReply}
                                canReply
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
                  ...(current === 'open' ? [{ status: 'in_progress' as const, label: 'In progress' }] : []),
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
                              ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              : 'bg-pink-500 text-white hover:bg-pink-600'
                    }`}
                >
                    {label}
                </button>
            ))}
        </>
    )
}
