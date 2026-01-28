'use client'

interface ChallengeProgressProps {
    current: number
    total: number
}

export default function ChallengeProgress({
    current,
    total,
}: ChallengeProgressProps) {
    const progressPercent = (current / total) * 100

    return (
        <div className='w-full px-4 py-2'>
            <div className='relative mb-2 h-2 w-full overflow-hidden rounded-full bg-gray-200'>
                <div
                    className='h-full bg-pink-500 transition-all duration-500'
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            <div className='hidden md:flex items-center justify-between text-sm'>
                <span className='text-xl text-black'>
                    Idol{' '}
                    <span className='font-bold'>
                        {Math.min(current + 1, total)}/{total}
                    </span>
                </span>
            </div>
        </div>
    )
}
