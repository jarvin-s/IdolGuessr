import { useState } from 'react'
import localFont from 'next/font/local'
import { createFeedbackTicket, type TicketCategory } from '@/lib/supabase'
import { addStoredTicket } from '@/utils/feedbackTickets'
import { CATEGORY_LABELS } from './ticketUi'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

const MAX_LENGTH = 2000

interface NewTicketFormProps {
    onCreated: (ticketId: string) => void
}

export default function NewTicketForm({ onCreated }: NewTicketFormProps) {
    const [category, setCategory] = useState<TicketCategory>('general')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const trimmed = message.trim()
        if (!trimmed) return
        setIsSubmitting(true)
        setError(null)
        try {
            const { id, access_token } = await createFeedbackTicket(
                category,
                trimmed
            )
            addStoredTicket(id, access_token)
            setMessage('')
            setCategory('general')
            onCreated(id)
        } catch (err) {
            console.error('Error submitting feedback:', err)
            setError('Something went wrong. Please try again.')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
            <div>
                <label
                    htmlFor='feedback-category'
                    className={`${proximaNovaBold.className} mb-1 block uppercase`}
                >
                    Category
                </label>
                <select
                    id='feedback-category'
                    value={category}
                    onChange={(e) =>
                        setCategory(e.target.value as TicketCategory)
                    }
                    className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none'
                >
                    {(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map(
                        (key) => (
                            <option key={key} value={key}>
                                {CATEGORY_LABELS[key]}
                            </option>
                        )
                    )}
                </select>
            </div>

            <div>
                <label
                    htmlFor='feedback-message'
                    className={`${proximaNovaBold.className} mb-1 block uppercase`}
                >
                    Message
                </label>
                <textarea
                    id='feedback-message'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={MAX_LENGTH}
                    className='w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none'
                    placeholder='Tell us what you think...'
                    required
                />
            </div>

            {error && <p className='text-sm text-red-600'>{error}</p>}

            <button
                type='submit'
                disabled={isSubmitting || !message.trim()}
                className='w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
            >
                {isSubmitting ? 'Submitting...' : 'Submit feedback'}
            </button>

            <p className='text-center text-sm text-gray-500'>
                Tickets are saved in this browser. Clearing your site data will
                remove access to them.
            </p>
        </form>
    )
}
