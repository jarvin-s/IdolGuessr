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

    const handleSubmit = () => {
        onSubmit(nickname.trim() || null)
    }

    return (
        <div className='fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4'>
            <div className='modal-fade-in relative w-full max-w-sm rounded-lg bg-white p-8 shadow-xl'>
                <div className='mb-4 text-center'>
                    <h2 className='mb-2 text-2xl font-bold'>
                        Challenge complete!
                    </h2>
                        <p className='text-black'>
                            Great job finishing the challenge.
                        </p>
                </div>

                {/* Score display */}
                <div className='mb-4 rounded-lg p-6 text-center'>
                    <div className='mb-2 text-5xl font-bold'>
                        {totalCorrect}/{totalIdols} 
                    </div>
                    <div className='text-lg font-bold'>
                        CORRECT
                    </div>
                </div>

                {/* Nickname input */}
                <div className='mb-6'>
                    <label className='mb-2 block  text-black'>
                        Enter a name <span className='font-bold'> (optional)</span>
                    </label>
                    <input
                        type='text'
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder='Your name'
                        maxLength={20}
                        className='w-full border border-gray-300 px-4 py-2 focus:border-pink-600 focus:ring-2 focus:ring-pink-200 focus:outline-none'
                    />
                </div>

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className='w-full cursor-pointer rounded-full bg-pink-600 py-3 font-bold text-white transition-colors hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50'
                >
                    {isSubmitting ? 'Submitting...' : 'See results'}
                </button>
            </div>
        </div>
    )
}
