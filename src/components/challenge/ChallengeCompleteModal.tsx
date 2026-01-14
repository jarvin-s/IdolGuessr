'use client'

import { useState } from 'react'

interface ChallengeCompleteModalProps {
    isOpen: boolean
    totalCorrect: number
    totalIdols: number
    isSubmitting: boolean
    onSubmit: (nickname: string | null) => void
}

export default function ChallengeCompleteModal({
    isOpen,
    totalCorrect,
    totalIdols,
    isSubmitting,
    onSubmit,
}: ChallengeCompleteModalProps) {
    const [nickname, setNickname] = useState('')

    if (!isOpen) return null

    const percentage = Math.round((totalCorrect / totalIdols) * 100)

    const handleSubmit = () => {
        onSubmit(nickname.trim() || null)
    }

    return (
        <div className='fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4'>
            <div className='modal-fade-in relative w-full max-w-sm rounded-lg bg-white p-8 shadow-xl'>
                <div className='mb-6 text-center'>
                    <h2 className='mb-2 text-2xl font-bold'>
                        Challenge Complete!
                    </h2>
                    <p className='text-gray-600'>
                        Great job finishing the challenge
                    </p>
                </div>

                {/* Score display */}
                <div className='mb-6 rounded-lg bg-gradient-to-r from-pink-100 to-pink-50 p-6 text-center'>
                    <div className='mb-2 text-5xl font-bold text-pink-600'>
                        {totalCorrect}/{totalIdols}
                    </div>
                    <div className='text-lg text-gray-600'>
                        {percentage}% accuracy
                    </div>
                </div>

                {/* Nickname input */}
                <div className='mb-6'>
                    <label className='mb-2 block text-sm font-medium text-gray-700'>
                        Enter a nickname (optional)
                    </label>
                    <input
                        type='text'
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder='Your nickname'
                        maxLength={20}
                        className='w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-pink-500 focus:ring-2 focus:ring-pink-200 focus:outline-none'
                    />
                    <p className='mt-1 text-xs text-gray-500'>
                        This will be shown on the results page
                    </p>
                </div>

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className='w-full cursor-pointer rounded-lg bg-pink-500 py-3 font-bold text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50'
                >
                    {isSubmitting ? 'Submitting...' : 'See results'}
                </button>
            </div>
        </div>
    )
}
