'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import copy from 'copy-to-clipboard'
import Image from 'next/image'
import ChallengeResultsView from '@/components/challenge/ChallengeResultsView'
import {
    getChallenge,
    getChallengeResults,
    getOrCreateSessionId,
    type Challenge,
    type ChallengeResult,
} from '@/lib/supabase'

export default function ChallengeResultsPage() {
    const params = useParams()
    const router = useRouter()
    const challengeId = params.id as string

    const [challenge, setChallenge] = useState<Challenge | null>(null)
    const [results, setResults] = useState<ChallengeResult[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sessionId, setSessionId] = useState<string>('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            const sid = getOrCreateSessionId()
            setSessionId(sid)

            const [challengeData, resultsData] = await Promise.all([
                getChallenge(challengeId),
                getChallengeResults(challengeId),
            ])

            if (!challengeData) {
                setError('Challenge not found or has expired')
                setIsLoading(false)
                return
            }

            setChallenge(challengeData)
            setResults(resultsData)
            setIsLoading(false)
        }

        void loadData()
    }, [challengeId])

    const handleCopyLink = useCallback(() => {
        const url = `${window.location.origin}/challenge/${challengeId}`
        const success = copy(url)
        if (success) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } else {
            console.error('Failed to copy link')
        }
    }, [challengeId])

    const handleNewChallenge = () => {
        router.push('/challenge')
    }

    if (isLoading) {
        return (
            <div className='fixed inset-0 flex items-center justify-center bg-white'>
                <div className='text-center'>
                    <div className='mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-pink-600 border-t-transparent' />
                    <p className='text-gray-600'>
                        Loading challenge results...
                    </p>
                </div>
            </div>
        )
    }

    if (error || !challenge) {
        return (
            <div className='fixed inset-0 flex items-center justify-center bg-white'>
                <div className='max-w-md p-8 text-center'>
                    <h1 className='mb-2 text-2xl font-bold'>
                        Challenge not found
                    </h1>
                    <p className='mb-6 text-gray-600'>
                        {error || 'This challenge may have expired.'}
                    </p>
                    <button
                        onClick={() => router.push('/challenge')}
                        className='cursor-pointer rounded-full bg-pink-600 px-6 py-2 font-bold text-white transition-colors hover:bg-pink-700'
                    >
                        Create new challenge
                    </button>
                </div>
            </div>
        )
    }

    const hasPlayed = results.some((r) => r.session_id === sessionId)

    return (
        <div className='min-h-screen bg-gradient-to-b from-pink-50 to-white'>
            {copied && (
                <div className='fade-in-from-top fixed top-4 left-1/2 z-50 -translate-x-1/2'>
                    <div className='rounded-full bg-pink-600 px-6 py-3'>
                        <p className='text-lg font-bold text-white'>
                            Link copied!
                        </p>
                    </div>
                </div>
            )}
            <div className='mx-auto max-w-lg px-4 py-8'>
                {/* Header */}
                <div className='mb-6 text-center'>
                    <button
                        onClick={() => router.push('/')}
                        className='mb-4 inline-block cursor-pointer'
                    >
                        <Image
                            src='/images/idolguessr-logo.png'
                            alt='Idol Guessr'
                            width={150}
                            height={40}
                            className='mx-auto'
                        />
                    </button>
                    <h1 className='text-2xl font-bold'>Challenge results</h1>
                    <p className='text-gray-600'>
                        {challenge.idol_count} idols •{' '}
                        {challenge.group_filter === 'both'
                            ? 'All groups'
                            : challenge.group_filter === 'boy-group'
                              ? 'Boy groups'
                              : 'Girl groups'}
                    </p>
                </div>

                {/* If user hasn't played yet */}
                {!hasPlayed && (
                    <div className='mb-6 rounded-lg bg-pink-100 p-6 text-center'>
                        <p className='mb-4 text-lg font-medium'>
                            You haven&apos;t played this challenge yet!
                        </p>
                        <button
                            onClick={() =>
                                router.push(`/challenge/${challengeId}`)
                            }
                            className='cursor-pointer rounded-full bg-pink-600 px-6 py-2 font-bold text-white transition-colors hover:bg-pink-700'
                        >
                            Play challenge
                        </button>
                    </div>
                )}

                {/* Share section */}
                <div className='mb-6'>
                    <div className='flex gap-2'>
                        <button
                            onClick={handleNewChallenge}
                            className='flex-1 cursor-pointer rounded-full bg-pink-600 px-4 py-3 font-bold text-white hover:bg-pink-700'
                        >
                            Play again?
                        </button>
                        <button
                            onClick={handleCopyLink}
                            className='cursor-pointer rounded-full border-2 border-pink-600 px-4 py-3 font-bold text-pink-600 hover:bg-pink-200/30'
                        >
                            {copied ? <CopiedIcon /> : <ShareIcon />}
                        </button>
                    </div>
                    <p className='mt-2 text-center text-lg'>
                        Challenge your friends to see who can get get the
                        highest score!
                    </p>
                </div>

                {/* Results view */}
                {results.length > 0 ? (
                    <ChallengeResultsView
                        challenge={challenge}
                        results={results}
                        currentSessionId={sessionId}
                    />
                ) : (
                    <div className='rounded-lg bg-gray-100 p-8 text-center'>
                        <p className='text-gray-600'>
                            No results yet. Be the first to play!
                        </p>
                    </div>
                )}

                {/* Back to home */}
                <div className='mt-8 text-center'>
                    <button
                        onClick={() => router.push('/')}
                        className='cursor-pointer text-gray-500 underline hover:text-gray-700'
                    >
                        Back to IdolGuessr
                    </button>
                </div>
            </div>
        </div>
    )
}

function ShareIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
        >
            <path
                fill='currentColor'
                d='M17 22q-1.25 0-2.125-.875T14 19q0-.15.075-.7L7.05 14.2q-.4.375-.925.588T5 15q-1.25 0-2.125-.875T2 12t.875-2.125T5 9q.6 0 1.125.213t.925.587l7.025-4.1q-.05-.175-.062-.337T14 5q0-1.25.875-2.125T17 2t2.125.875T20 5t-.875 2.125T17 8q-.6 0-1.125-.213T14.95 7.2l-7.025 4.1q.05.175.063.338T8 12t-.012.363t-.063.337l7.025 4.1q.4-.375.925-.587T17 16q1.25 0 2.125.875T20 19t-.875 2.125T17 22'
            />
        </svg>
    )
}

function CopiedIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='24'
            height='24'
            viewBox='0 0 24 24'
        >
            <path
                fill='currentColor'
                d='m9 19.414l-6.707-6.707l1.414-1.414L9 16.586L20.293 5.293l1.414 1.414z'
            />
        </svg>
    )
}
