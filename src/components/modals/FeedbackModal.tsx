import { useCallback, useEffect, useRef, useState } from 'react'
import localFont from 'next/font/local'
import {
    addFeedbackMessage,
    getFeedbackThread,
    getMyFeedbackTickets,
    type FeedbackThread,
    type FeedbackTicket,
} from '@/lib/supabase'
import {
    getStoredTickets,
    getTicketToken,
    hasUnread,
    markSeen,
    type StoredTicket,
} from '@/utils/feedbackTickets'
import { useTicketLiveUpdates } from '@/hooks/useTicketLiveUpdates'
import NewTicketForm from '@/components/feedback/NewTicketForm'
import TicketList from '@/components/feedback/TicketList'
import TicketThread from '@/components/feedback/TicketThread'
import {
    formatTicketNumber,
    resolveTicketNumber,
} from '@/components/feedback/ticketUi'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
    onBack: () => void
}

type View = 'new' | 'submitted' | 'list' | 'thread'

export default function FeedbackModal({
    isOpen,
    onClose,
    onBack,
}: FeedbackModalProps) {
    const [view, setView] = useState<View>('new')
    const [tickets, setTickets] = useState<FeedbackTicket[]>([])
    const [ticketsLoading, setTicketsLoading] = useState(false)
    const [ticketsError, setTicketsError] = useState<string | null>(null)
    const [thread, setThread] = useState<FeedbackThread | null>(null)
    const [threadError, setThreadError] = useState<string | null>(null)
    const [, setSeenVersion] = useState(0)
    const [storedTickets, setStoredTickets] = useState<StoredTicket[]>([])
    const threadRef = useRef<FeedbackThread | null>(null)
    threadRef.current = thread

    const loadTickets = useCallback(async () => {
        const stored = getStoredTickets()
        setStoredTickets(stored)
        if (stored.length === 0) {
            setTickets([])
            return
        }
        setTicketsLoading(true)
        setTicketsError(null)
        try {
            const data = await getMyFeedbackTickets(
                stored.map(({ id, token }) => ({ id, token }))
            )
            setTickets(data)
        } catch (err) {
            console.error('Error loading tickets:', err)
            setTicketsError('Could not load your tickets.')
        } finally {
            setTicketsLoading(false)
        }
    }, [])

    const openThread = useCallback(async (ticketId: string) => {
        const token = getTicketToken(ticketId)
        if (!token) return
        setThreadError(null)
        setView('thread')
        try {
            const data = await getFeedbackThread(ticketId, token)
            setThread(data)
            markSeen(ticketId, data.ticket.last_admin_message_at)
            setSeenVersion((v) => v + 1)
        } catch (err) {
            console.error('Error loading ticket:', err)
            setThreadError('Could not load this ticket.')
        }
    }, [])

    useEffect(() => {
        if (!isOpen) return
        const stored = getStoredTickets()
        setView(stored.length > 0 ? 'list' : 'new')
        setThread(null)
        loadTickets()
    }, [isOpen, loadTickets])

    const handleLiveUpdate = useCallback(
        async (ticketId: string) => {
            loadTickets()
            if (threadRef.current?.ticket.id !== ticketId) return
            const token = getTicketToken(ticketId)
            if (!token) return
            try {
                const data = await getFeedbackThread(ticketId, token)
                if (threadRef.current?.ticket.id !== ticketId) return
                setThread(data)
                markSeen(ticketId, data.ticket.last_admin_message_at)
                setSeenVersion((v) => v + 1)
            } catch (err) {
                console.error('Error refreshing ticket:', err)
            }
        },
        [loadTickets]
    )

    useTicketLiveUpdates(storedTickets, handleLiveUpdate, isOpen)

    if (!isOpen) return null

    const unreadCount = tickets.filter(hasUnread).length
    const activeTicketNumber = thread
        ? resolveTicketNumber(thread.ticket, tickets)
        : null
    const activeTicketNumberLabel = formatTicketNumber(activeTicketNumber)

    const handleBack = () => {
        if (view === 'thread') {
            setThread(null)
            setView('list')
            loadTickets()
            return
        }
        onBack()
    }

    const handleSend = async (body: string) => {
        if (!thread) return
        const token = getTicketToken(thread.ticket.id)
        if (!token) return
        await addFeedbackMessage(thread.ticket.id, token, body)
        const updated = await getFeedbackThread(thread.ticket.id, token)
        setThread(updated)
        markSeen(updated.ticket.id, updated.ticket.last_admin_message_at)
    }

    return (
        <div className='bg-opacity-50 fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='relative flex max-h-[90dvh] w-full max-w-md min-w-0 flex-col overflow-y-auto rounded-lg bg-white p-4 sm:p-6'>
                <div className='mb-6 flex items-center justify-between'>
                    <button
                        onClick={handleBack}
                        className='flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-100 px-3 transition-colors hover:bg-gray-200'
                        aria-label='Go back'
                    >
                        <ArrowLeftIcon />
                        <span className='text-sm text-gray-600'>Go back</span>
                    </button>
                    <button
                        onClick={onClose}
                        className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                        aria-label='Close Feedback'
                    >
                        <svg
                            className='h-4 w-4 text-gray-600'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                            />
                        </svg>
                    </button>
                </div>

                {view === 'thread' ? (
                    <>
                        <h1
                            className={`${proximaNovaBold.className} mb-3 text-xl break-words uppercase`}
                        >
                            {activeTicketNumberLabel && (
                                <span className='mr-2 font-mono text-base text-gray-500 normal-case'>
                                    {activeTicketNumberLabel}
                                </span>
                            )}
                            {thread?.ticket.subject ?? 'Ticket'}
                        </h1>
                        {threadError ? (
                            <p className='py-6 text-center text-sm text-red-600'>
                                {threadError}
                            </p>
                        ) : thread ? (
                            <div className='flex h-[55vh] flex-col'>
                                <TicketThread
                                    thread={thread}
                                    viewer='user'
                                    onSend={handleSend}
                                    canReply={thread.ticket.status !== 'closed'}
                                    closedNotice='This ticket has been closed. Open a new ticket if you need more help.'
                                    ticketNumber={activeTicketNumber}
                                />
                            </div>
                        ) : (
                            <p className='py-6 text-center text-sm text-gray-500'>
                                Loading ticket...
                            </p>
                        )}
                    </>
                ) : view === 'submitted' ? (
                    <div className='text-center'>
                        <h1
                            className={`${proximaNovaBold.className} text-2xl text-green-600 uppercase`}
                        >
                            Thank you!
                        </h1>
                        <p className='mt-2 text-black'>
                            Your feedback has been submitted successfully.
                        </p>
                        <p className='mt-1 text-sm text-gray-600'>
                            You can follow replies under My tickets.
                        </p>
                        <button
                            onClick={() => {
                                setView('list')
                                loadTickets()
                            }}
                            className='mt-6 w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600'
                        >
                            View my tickets
                        </button>
                    </div>
                ) : (
                    <>
                        <h1
                            className={`${proximaNovaBold.className} text-2xl uppercase`}
                        >
                            Feedback
                        </h1>
                        <p className='mt-2 text-gray-600'>
                            All feedback is welcome! Fill in the form to open a
                            ticket and we&apos;ll get back to you there.
                        </p>

                        <div className='mt-4 flex rounded-full bg-gray-100 p-1'>
                            <TabButton
                                active={view === 'new'}
                                onClick={() => setView('new')}
                            >
                                New ticket
                            </TabButton>
                            <TabButton
                                active={view === 'list'}
                                onClick={() => {
                                    setView('list')
                                    loadTickets()
                                }}
                            >
                                My tickets
                                {unreadCount > 0 && (
                                    <span className='ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 px-1.5 text-xs text-white'>
                                        {unreadCount}
                                    </span>
                                )}
                            </TabButton>
                        </div>

                        {view === 'new' ? (
                            <NewTicketForm
                                onCreated={() => {
                                    setView('submitted')
                                    loadTickets()
                                }}
                            />
                        ) : (
                            <div className='mt-6'>
                                <TicketList
                                    tickets={tickets}
                                    isLoading={ticketsLoading}
                                    error={ticketsError}
                                    isUnread={hasUnread}
                                    onSelect={(ticket) => openThread(ticket.id)}
                                    emptyMessage='You have no tickets yet.'
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

function TabButton({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type='button'
            onClick={onClick}
            className={`flex flex-1 cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-sm transition-colors ${
                active
                    ? 'bg-white font-medium text-black shadow-sm'
                    : 'text-gray-600 hover:text-black'
            }`}
        >
            {children}
        </button>
    )
}

function ArrowLeftIcon() {
    return (
        <svg
            className='h-4 w-4 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M10 19l-7-7m0 0l7-7m-7 7h18'
            />
        </svg>
    )
}
