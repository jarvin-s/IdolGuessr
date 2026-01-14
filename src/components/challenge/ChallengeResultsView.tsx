'use client'

import Image from 'next/image'
import { getImageUrl } from '@/lib/supabase'
import type {
    Challenge,
    ChallengeResult,
    ChallengeIdolResult,
} from '@/lib/supabase'

interface ChallengeResultsViewProps {
    challenge: Challenge
    results: ChallengeResult[]
    currentSessionId: string
}

export default function ChallengeResultsView({
    challenge,
    results,
    currentSessionId,
}: ChallengeResultsViewProps) {
    const getIdolResult = (
        result: ChallengeResult,
        idolId: number
    ): ChallengeIdolResult | undefined => {
        return result.results.find((r) => r.idol_id === idolId)
    }

    return (
        <div className='w-full'>
            {/* Leaderboard */}
            <div className='mb-6'>
                <h2 className='mb-3 text-2xl font-bold'>Leaderboard</h2>
                <div className='space-y-2'>
                    {results.map((result, index) => {
                        const isMe = result.session_id === currentSessionId
                        const displayName =
                            result.nickname ||
                            (isMe ? 'You' : `Player ${index + 1}`)

                        return (
                            <div
                                key={result.session_id}
                                className={`flex items-center justify-between rounded-lg p-3 ${
                                    isMe
                                        ? 'border-2 border-pink-400 bg-pink-100'
                                        : 'bg-gray-100'
                                }`}
                            >
                                <div className='flex items-center gap-3'>
                                    <span
                                        className={`text-lg font-bold ${index === 0 ? 'text-pink-600' : 'text-gray-500'}`}
                                    >
                                        #{index + 1}
                                    </span>
                                    <span className='font-medium'>
                                        {displayName}
                                        {isMe && displayName !== 'You' && (
                                            <span className='ml-1 text-pink-600'>
                                                (you)
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className='text-right'>
                                    <span className='text-lg font-bold'>
                                        {result.total_correct}/
                                        {challenge.idol_count}
                                    </span>
                                    <span className='ml-2'>correct</span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Idol breakdown */}
            <div>
                <h2 className='mb-3 text-2xl font-bold'>Idol breakdown</h2>
                <div className='space-y-3'>
                    {challenge.idols.map((idol, idolIndex) => {
                        const imageUrl = getImageUrl(
                            '',
                            idol.img_bucket,
                            'clear',
                            'unlimited',
                            idol.group_category,
                            idol.base64_group
                        )

                        return (
                            <div
                                key={idol.id}
                                className='overflow-hidden border border-[#0f0f0f] bg-white'
                            >
                                {/* Idol header */}
                                <div className='flex items-center gap-3 p-3'>
                                    <span className='text-lg text-black'>
                                        #{idolIndex + 1}
                                    </span>
                                    <div className='relative h-18 w-18 overflow-hidden rounded-full'>
                                        <Image
                                            src={imageUrl}
                                            alt={idol.name}
                                            fill
                                            className='object-cover'
                                        />
                                    </div>
                                    <div>
                                        <div className='text-lg font-bold'>
                                            {idol.name}
                                        </div>
                                        {idol.group_name && (
                                            <div className='text-md text-gray-500'>
                                                {idol.group_name}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Player results for this idol */}
                                <div className='divide-y divide-gray-100'>
                                    {results.map((result, playerIndex) => {
                                        const idolResult = getIdolResult(
                                            result,
                                            idol.id
                                        )
                                        const isMe =
                                            result.session_id ===
                                            currentSessionId
                                        const displayName =
                                            result.nickname ||
                                            (isMe
                                                ? 'You'
                                                : `Player ${playerIndex + 1}`)

                                        if (!idolResult) return null

                                        return (
                                            <div
                                                key={result.session_id}
                                                className={`flex items-center justify-between px-3 py-2 ${
                                                    isMe ? 'bg-pink-50' : ''
                                                }`}
                                            >
                                                <span className='text-sm'>
                                                    {displayName}
                                                    {isMe &&
                                                        displayName !==
                                                            'You' && (
                                                            <span className='ml-1 text-xs text-pink-600'>
                                                                (you)
                                                            </span>
                                                        )}
                                                </span>
                                                <div className='flex items-center gap-2'>
                                                    {idolResult.correct ? (
                                                        <>
                                                            <span className='text-sm text-green-600'>
                                                                {
                                                                    idolResult.guess_count
                                                                }{' '}
                                                                {idolResult.guess_count ===
                                                                1
                                                                    ? 'guess'
                                                                    : 'guesses'}
                                                            </span>
                                                            <span className='text-green-500'>
                                                                ✓
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <span className='text-sm text-red-500'>
                                                                Failed
                                                            </span>
                                                            <span className='text-red-400'>
                                                                ✕
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
