import { useState } from 'react'
import localFont from 'next/font/local'
import { insertNewFeedback } from '@/lib/supabase'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

interface FeedbackModalProps {
    isOpen: boolean
    onClose: () => void
    onBack: () => void
}

export default function FeedbackModal({
    isOpen,
    onClose,
    onBack,
}: FeedbackModalProps) {
    const [feedbackForm, setFeedbackForm] = useState({
        category: 'general',
        message: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    if (!isOpen) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!feedbackForm.message.trim()) return
        setIsSubmitting(true)
        try {
            await insertNewFeedback({
                id: 0,
                message: feedbackForm.message.trim(),
                category: feedbackForm.category,
            })
            setSubmitted(true)
            setTimeout(() => {
                setFeedbackForm({ category: 'general', message: '' })
                setSubmitted(false)
                onBack()
            }, 2000)
        } catch (error) {
            console.error('Error submitting feedback:', error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className='bg-opacity-50 fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='relative maxh-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6'>
                <div className='mb-6 flex items-center justify-between'>
                    <button
                        onClick={onBack}
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
                        <svg className='h-4 w-4 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>
                </div>

                {submitted ? (
                    <div className='text-center'>
                        <h1 className={`${proximaNovaBold.className} text-2xl text-green-600 uppercase`}>
                            Thank you!
                        </h1>
                        <p className='mt-2 text-black'>Your feedback has been submitted successfully.</p>
                    </div>
                ) : (
                    <>
                        <h1 className={`${proximaNovaBold.className} text-2xl uppercase`}>
                            Submit your feedback
                        </h1>
                        <p className='mt-2 text-gray-600'>
                            We&apos;re always looking for ways to improve the game. Please share your thoughts with us.
                        </p>

                        <form onSubmit={handleSubmit} className='mt-6 space-y-4'>
                            <div>
                                <label htmlFor='feedback-category' className={`${proximaNovaBold.className} mb-1 block uppercase`}>
                                    Category
                                </label>
                                <select
                                    id='feedback-category'
                                    value={feedbackForm.category}
                                    onChange={(e) =>
                                        setFeedbackForm((prev) => ({
                                            ...prev,
                                            category: e.target.value,
                                        }))
                                    }
                                    className='w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none'
                                >
                                    <option value='general'>General</option>
                                    <option value='bug'>Bug Report</option>
                                    <option value='feature'>Feature Request</option>
                                    <option value='improvement'>Improvement</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor='feedback-message' className={`${proximaNovaBold.className} mb-1 block uppercase`}>
                                    Message
                                </label>
                                <textarea
                                    id='feedback-message'
                                    value={feedbackForm.message}
                                    onChange={(e) =>
                                        setFeedbackForm((prev) => ({
                                            ...prev,
                                            message: e.target.value,
                                        }))
                                    }
                                    rows={4}
                                    className='w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none'
                                    placeholder='Tell us what you think...'
                                    required
                                />
                            </div>

                            <button
                                type='submit'
                                disabled={isSubmitting || !feedbackForm.message.trim()}
                                className='w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit feedback'}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    )
}

function ArrowLeftIcon() {
    return (
        <svg className='h-4 w-4 text-gray-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M10 19l-7-7m0 0l7-7m-7 7h18' />
        </svg>
    )
}


