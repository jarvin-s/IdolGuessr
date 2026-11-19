import Image from 'next/image'
import { useState, useEffect } from 'react'
import ClassicModeModal from '@/components/classic/ClassicModeModal'
import VisualModeModal from '@/components/modals/VisualModeModal'
import UnshuffledModeModal from '@/components/unshuffled/UnshuffledModeModal'
import { getDailyCount } from '@/lib/supabase'

interface IndexModalProps {
    isOpen: boolean
    onDaily: () => void
    onInfinite: () => void
    onHangul: () => void
    onChallenge?: () => void
    onDuels?: () => void
    onUnshuffled?: () => void
    onUnshuffledDaily?: () => void
    onClassic?: () => void
    onClassicDaily?: () => void
}

export default function IndexModal({
    isOpen,
    onDaily,
    onInfinite,
    onHangul,
    onChallenge,
    onDuels,
    onUnshuffled,
    onUnshuffledDaily,
    onClassic,
    onClassicDaily,
}: IndexModalProps) {
    const [isClosing, setIsClosing] = useState(false)
    const [visualOpen, setVisualOpen] = useState(false)
    const [unshuffledOpen, setUnshuffledOpen] = useState(false)
    const [classicOpen, setClassicOpen] = useState(false)
    const [dailyCount, setDailyCount] = useState<number | null>(null)
    const [todayLabel, setTodayLabel] = useState<string | null>(null)

    useEffect(() => {
        if (!isOpen) {
            setVisualOpen(false)
            setUnshuffledOpen(false)
            setClassicOpen(false)
        }
    }, [isOpen])

    useEffect(() => {
        setTodayLabel(
            new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        )
    }, [])

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

    const handleUnshuffled = () => {
        setUnshuffledOpen(true)
    }

    return (
        <div
            className={`fixed inset-0 z-500 flex items-center justify-center bg-[#e6e6e3] transition-opacity duration-300 dark:bg-zinc-950 ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        >
            <div
                className={`flex w-full max-w-2xl flex-col items-center px-6 text-center transition-transform duration-300 ${isClosing ? 'scale-95' : 'scale-100'}`}
            >
                <div className='mb-8 flex items-center justify-center'>
                    <Image
                        src='/images/idolguessr-logo.webp'
                        alt='Classicr Logo'
                        width={350}
                        height={350}
                        className='h-auto w-auto dark:invert'
                    />
                </div>

                <p className='text-4xl'>
                    Guess your favorite K-pop idol in different ways!
                </p>

                <div className='mt-8 flex flex-col items-center gap-3 md:flex-row'>
                    <div className='flex justify-center gap-3'>
                        <div className='relative flex flex-row items-center justify-center'>
                            <span className='absolute -top-2 -right-2 z-10 rounded-full bg-pink-500 px-1.5 py-0.5 text-[10px] leading-none font-bold tracking-wide text-white uppercase'>
                                New
                            </span>
                            <button
                                onClick={() => setClassicOpen(true)}
                                className='flex w-22.5 cursor-pointer flex-col items-center justify-center border-2 border-pink-500 bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb] dark:bg-zinc-800 dark:hover:bg-zinc-700'
                            >
                                <ClassicIcon />
                                Classic
                            </button>
                        </div>
                        <div className='flex flex-row items-center justify-center'>
                            <button
                                onClick={() => setVisualOpen(true)}
                                className='flex w-22.5 cursor-pointer flex-col items-center justify-center border bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb] dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                            >
                                <VisualIcon />
                                Visual
                            </button>
                        </div>
                        <div className='relative flex flex-row items-center justify-center'>
                            <button
                                onClick={handleUnshuffled}
                                className='flex w-22.5 cursor-pointer flex-col items-center justify-center border bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb] dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                            >
                                <UnshuffledIcon />
                                Unshuffled
                            </button>
                        </div>
                    </div>
                    <div className='flex justify-center gap-3'>
                        <div className='relative flex flex-row items-center justify-center'>
                            <button
                                onClick={handleHangul}
                                className='flex w-22.5 cursor-pointer flex-col items-center justify-center border bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb] dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                            >
                                <HangulIcon />
                                Hangul
                            </button>
                        </div>
                        <div className='relative flex flex-row items-center justify-center'>
                            <button
                                onClick={handleChallenge}
                                className='flex w-22.5 cursor-pointer flex-col items-center justify-center border bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb] dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                            >
                                <ChallengeIcon />
                                Challenge
                            </button>
                        </div>
                        <div className='relative flex flex-row items-center justify-center'>
                            <button
                                onClick={() => onDuels?.()}
                                className='flex w-22.5 cursor-pointer flex-col items-center justify-center border bg-[#f3f3f3] p-3 hover:bg-[#dbdbdb] dark:border-zinc-600 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                            >
                                <DuelsIcon />
                                Duels
                            </button>
                        </div>
                    </div>
                </div>

                <h1 className='mt-6 text-xl font-bold'>
                    {todayLabel ?? '\u00A0'}
                </h1>
                <p className='text-lg'>Daily #{dailyCount ?? ''}</p>
            </div>
            <VisualModeModal
                open={visualOpen}
                onClose={() => setVisualOpen(false)}
                onDaily={handleDaily}
                onInfinite={handleInfinite}
            />
            <UnshuffledModeModal
                open={unshuffledOpen}
                onClose={() => setUnshuffledOpen(false)}
                onDaily={() => onUnshuffledDaily?.()}
                onUnlimited={() => onUnshuffled?.()}
            />
            <ClassicModeModal
                open={classicOpen}
                onClose={() => setClassicOpen(false)}
                onDaily={() => onClassicDaily?.()}
                onUnlimited={() => onClassic?.()}
            />
        </div>
    )
}

function VisualIcon() {
    return (
        <span
            aria-hidden
            className='inline-block h-9 w-9 bg-current mask-contain mask-center mask-no-repeat'
            style={{
                maskImage: 'url(/icons/image.svg)',
                WebkitMaskImage: 'url(/icons/image.svg)',
            }}
        />
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

function UnshuffledIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='36'
            height='36'
            viewBox='0 0 24 24'
        >
            <path
                fill='currentColor'
                d='M14 20v-2h2.6l-3.175-3.175L14.85 13.4L18 16.55V14h2v6zm-8.6 0L4 18.6L16.6 6H14V4h6v6h-2V7.4zm3.775-9.425L4 5.4L5.4 4l5.175 5.175z'
            />
        </svg>
    )
}

function ClassicIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='36'
            height='36'
            viewBox='0 0 24 24'
            fill='currentColor'
        >
            <rect x='3' y='3' width='7' height='7' rx='1.5' />
            <rect x='14' y='3' width='7' height='7' rx='1.5' opacity='0.45' />
            <rect x='3' y='14' width='7' height='7' rx='1.5' opacity='0.7' />
            <rect x='14' y='14' width='7' height='7' rx='1.5' opacity='0.3' />
        </svg>
    )
}

function DuelsIcon() {
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
            <path d='M14.5 17.5 3 6V3h3l11.5 11.5' />
            <path d='M13 19l6-6' />
            <path d='m16 16 4 4' />
            <path d='m19 21 2-2' />
            <path d='M14.5 6.5 21 3v3l-6.5 11.5' />
            <path d='m5 14 4 4' />
            <path d='m8 16-4 4' />
            <path d='m3 21 2-2' />
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
