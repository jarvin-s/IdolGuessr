import Image from 'next/image'
import { useState, useEffect } from 'react'
import { getDailyCount } from '@/lib/supabase'

interface IndexModalProps {
    isOpen: boolean
    onDaily: () => void
    onInfinite: () => void
    onHangul: () => void
    onChallenge?: () => void
}

export default function IndexModal({
    isOpen,
    onDaily,
    onInfinite,
    onHangul,
    onChallenge,
}: IndexModalProps) {
    const [isClosing, setIsClosing] = useState(false)
    const [dailyCount, setDailyCount] = useState<number | null>(null)

    useEffect(() => {
        if (isOpen) {
            setIsClosing(false)
            getDailyCount()
                .then(setDailyCount)
                .catch(() => setDailyCount(0))
        }
    }, [isOpen])

    if (!isOpen) {
        return null
    }

    const handleDaily = () => {
        setIsClosing(true)
        setTimeout(() => {
            onDaily()
        }, 300)
    }

    const handleInfinite = () => {
        onInfinite()
    }

    const handleHangul = () => {
        onHangul()
    }

    const handleChallenge = () => {
        onChallenge?.()
    }

    return (
        <div
            className={`fixed inset-0 z-[500] flex items-center justify-center bg-[#e6e6e3] transition-opacity duration-300 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        >
            <div
                className={`flex w-full max-w-2xl flex-col items-center px-6 text-center transition-transform duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}
            >
                <div className='mb-8 flex items-center justify-center'>
                    <Image
                        src='/images/idolguessr-logo.png'
                        alt='IdolGuessr Logo'
                        width={350}
                        height={350}
                        className='h-auto w-auto'
                    />
                </div>

                <p className='text-4xl'>
                    Guess your favorite K-pop idol in different ways!
                </p>

                <div className='mt-8 grid grid-cols-2 justify-center gap-3 md:grid-cols-4'>
                    <div className='flex flex-row items-center justify-center'>
                        <button
                            onClick={handleDaily}
                            className='flex w-[90px] cursor-pointer flex-col items-center justify-center border bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb]'
                        >
                            <DailyIcon />
                            Daily
                        </button>
                    </div>
                    <div className='flex flex-row items-center justify-center'>
                        <button
                            onClick={handleInfinite}
                            className='flex w-[90px] cursor-pointer flex-col items-center justify-center border bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb]'
                        >
                            <InfiniteIcon />
                            Infinite
                        </button>
                    </div>
                    <div className='relative flex flex-row items-center justify-center'>
                        <button
                            onClick={handleHangul}
                            className='flex w-[90px] cursor-pointer flex-col items-center justify-center border bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb]'
                        >
                            <HangulIcon />
                            Hangul
                        </button>
                    </div>
                    <div className='relative flex flex-row items-center justify-center'>
                        <span className='absolute -top-2 -right-2 z-10 rounded-full bg-pink-600 px-1.5 py-0.5 text-xs font-bold text-white'>
                            NEW
                        </span>
                        <button
                            onClick={handleChallenge}
                            className='flex w-[90px] cursor-pointer flex-col items-center justify-center border border-pink-600 bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb]'
                        >
                            <ChallengeIcon />
                            Challenge
                        </button>
                    </div>
                </div>

                <h1 className='mt-6 text-xl font-bold'>
                    {new Date().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </h1>
                <p className='text-lg'>Daily #{dailyCount ?? ''}</p>
            </div>
        </div>
    )
}

function DailyIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='36'
            height='36'
            viewBox='0 0 24 24'
        >
            <path
                fill='currentColor'
                d='M7.195 2.845a.75.75 0 0 0-1.467 0c-.232 1.096-.55 1.835-.99 2.361c-.429.516-1.029.893-1.95 1.166a.75.75 0 0 0 0 1.438c.885.262 1.48.617 1.916 1.125c.444.516.782 1.26 1.024 2.402a.75.75 0 0 0 1.467 0c.242-1.143.58-1.886 1.024-2.402c.436-.508 1.03-.863 1.917-1.125a.75.75 0 0 0 0-1.438c-.886-.262-1.481-.617-1.917-1.125c-.444-.516-.782-1.26-1.024-2.402m8.303 3.251a.75.75 0 0 0-1.458 0c-.554 2.292-1.141 3.674-1.972 4.638c-.82.952-1.947 1.576-3.77 2.192a.75.75 0 0 0 0 1.421c1.904.643 3.046 1.322 3.852 2.292c.819.986 1.362 2.355 1.89 4.537a.75.75 0 0 0 1.458 0c.554-2.291 1.142-3.673 1.972-4.637c.82-.952 1.947-1.576 3.77-2.192a.75.75 0 0 0 0-1.421c-1.907-.644-3.047-1.32-3.852-2.29c-.818-.984-1.36-2.352-1.89-4.54'
            />
        </svg>
    )
}

function HangulIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='36'
            height='36'
            viewBox='0 0 24 24'
        >
            <path
                fill='currentColor'
                d='M8 4v2H4v2h2.39C5.55 8.74 5 9.8 5 11c0 2.2 1.8 4 4 4s4-1.8 4-4c0-1.2-.55-2.26-1.39-3H14V6h-4V4m5 0v12h2v-5h3V9h-3V4M9 9c1.12 0 2 .88 2 2s-.88 2-2 2s-2-.88-2-2s.88-2 2-2m-2 7v4h10v-2H9v-2Z'
            />
        </svg>
    )
}

function InfiniteIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='36'
            height='36'
            viewBox='0 0 512 512'
        >
            <path
                fill='currentColor'
                d='M382 136c-40.87 0-73.46 20.53-93.6 37.76l-.71.61l-11.47 12.47l25.32 41.61l18.74-18.79C339.89 193.1 361.78 184 382 184c40.8 0 74 32.3 74 72s-33.2 72-74 72c-62 0-104.14-81.95-104.56-82.78C275 240.29 221.56 136 130 136C62.73 136 8 189.83 8 256s54.73 120 122 120c32.95 0 65.38-13.11 93.79-37.92l.61-.54l11.38-12.38l-25.33-41.61l-18.83 18.88C172 319.4 151.26 328 130 328c-40.8 0-74-32.3-74-72s33.2-72 74-72c62 0 104.14 81.95 104.56 82.78C237 271.71 290.44 376 382 376c67.27 0 122-53.83 122-120s-54.73-120-122-120'
            />
        </svg>
    )
}

function ChallengeIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='36'
            height='36'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        >
            <path d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6' />
            <path d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18' />
            <path d='M4 22h16' />
            <path d='M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' />
            <path d='M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' />
            <path d='M18 2H6v7a6 6 0 0 0 12 0V2Z' />
        </svg>
    )
}
