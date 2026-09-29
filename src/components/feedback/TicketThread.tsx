import { useEffect, useRef, useState } from 'react'
import type { FeedbackThread } from '@/lib/supabase'
import { CATEGORY_LABELS, StatusPill, formatTicketDate, formatTicketNumber } from './ticketUi'

const MAX_LENGTH = 2000

interface TicketThreadProps {
    thread: FeedbackThread
    viewer: 'user' | 'admin'
    onSend: (body: string) => Promise<void>
    canReply: boolean
    closedNotice?: string
    ticketNumber?: number | null
}

export default function TicketThread({
    thread,
    viewer,
    onSend,
    canReply,
    closedNotice,
    ticketNumber,
}: TicketThreadProps) {
    const [reply, setReply] = useState('')
    const [isSending, setIsSending] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ block: 'end' })
    }, [thread.messages.length])

    const submitReply = async () => {
        const trimmed = reply.trim()
        if (!trimmed || isSending) return
        setIsSending(true)
        setError(null)
        try {
            await onSend(trimmed)
            setReply('')
        } catch (err) {
            console.error('Error sending message:', err)
            setError('Could not send your message. Please try again.')
        } finally {
            setIsSending(false)
        }
    }

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault()
        void submitReply()
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void submitReply()
        }
    }

    const { ticket, messages } = thread
    const ticketNumberLabel = formatTicketNumber(ticketNumber ?? ticket.ticket_number)

    return (
        <div className='flex min-h-0 flex-1 flex-col'>
            <div className='mb-3 flex flex-wrap items-center gap-2 text-xs text-gray-500'>
                {ticketNumberLabel && (
                    <span className='rounded-full bg-gray-200 px-2 py-0.5 font-mono font-medium text-gray-700'>
                        {ticketNumberLabel}
                    </span>
                )}
                <StatusPill status={ticket.status} />
                <span>{CATEGORY_LABELS[ticket.category] ?? ticket.category}</span>
                <span>Opened {formatTicketDate(ticket.created_at)}</span>
            </div>

            <div className='min-h-0 flex-1 space-y-3 overflow-y-auto rounded-lg bg-gray-50 p-3'>
                {messages.map((message) => {
                    const own = message.sender === viewer
                    const author = message.sender === 'admin' ? 'Creator' : viewer === 'admin' ? 'Player' : 'You'
                    return (
                        <div key={message.id} className={`flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                            <div
                                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm break-words whitespace-pre-wrap ${
                                    own ? 'bg-pink-500 text-white' : 'border border-gray-200 bg-white text-gray-900'
                                }`}
                            >
                                {message.body}
                            </div>
                            <span className='mt-1 text-[11px] text-gray-400'>
                                {author} &middot; {formatTicketDate(message.created_at)}
                            </span>
                        </div>
                    )
                })}
                <div ref={bottomRef} />
            </div>

            {canReply ? (
                <form onSubmit={handleSend} className='mt-3 space-y-2'>
                    <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={3}
                        maxLength={MAX_LENGTH}
                        placeholder='Write a reply... (Enter to send, Shift+Enter for new line)'
                        className='w-full resize-none rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none'
                    />
                    {error && <p className='text-sm text-red-600'>{error}</p>}
                    <button
                        type='submit'
                        disabled={isSending || !reply.trim()}
                        className='w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
                    >
                        {isSending ? 'Sending...' : 'Send reply'}
                    </button>
                </form>
            ) : (
                <p className='mt-3 text-center text-sm text-gray-500'>
                    {closedNotice ?? 'This ticket is closed.'}
                </p>
            )}
        </div>
    )
}
