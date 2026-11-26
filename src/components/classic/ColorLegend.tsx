'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import localFont from 'next/font/local'
import FeedbackIcon, { type FeedbackMark } from '@/components/theme/FeedbackIcon'
import { useColorblind } from '@/components/theme/ColorblindProvider'
import { feedbackPalette, type FeedbackTone } from '@/lib/feedbackPalette'

const proximaNova = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

const ITEMS: Array<{
    label: string
    tone: FeedbackTone
    mark?: FeedbackMark
    direction?: 'up' | 'down'
}> = [
    { label: 'Correct', tone: 'correct', mark: 'correct' },
    { label: 'Partial', tone: 'partial', mark: 'partial' },
    { label: 'Incorrect', tone: 'wrong', mark: 'wrong' },
    { label: 'Higher\nYounger', tone: 'higher', direction: 'up' },
    { label: 'Lower\nOlder', tone: 'lower', direction: 'down' },
]

export function ProfileSourceNote({ onReport }: { onReport?: () => void }) {
    const [open, setOpen] = useState(false)
    const [pinned, setPinned] = useState(false)
    const root = useRef<HTMLDivElement>(null)
    const shown = open || pinned

    useEffect(() => {
        if (!pinned) return
        const close = (event: MouseEvent) => {
            if (!root.current?.contains(event.target as Node)) {
                setPinned(false)
                setOpen(false)
            }
        }
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setPinned(false)
                setOpen(false)
            }
        }
        window.addEventListener('mousedown', close)
        window.addEventListener('keydown', onKey)
        return () => {
            window.removeEventListener('mousedown', close)
            window.removeEventListener('keydown', onKey)
        }
    }, [pinned])

    return (
        <div
            ref={root}
            className=''
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
        >
            <button
                type='button'
                aria-expanded={shown}
                aria-label='About these profiles'
                onClick={() => setPinned((current) => !current)}
                className='flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border border-pink-500 bg-pink-500/20 text-base font-bold text-pink-600 hover:bg-pink-500/30 dark:text-pink-400'
            >
                ?
            </button>
            <AnimatePresence>
                {shown ? (
                    <motion.div
                        initial={{ opacity: 0, y: 4, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 4, x: '-50%' }}
                        transition={{ duration: 0.15 }}
                        role='tooltip'
                        className='absolute top-12 left-1/2 z-20 w-72 rounded-md border border-gray-200 bg-white p-3 text-left text-sm leading-relaxed font-normal text-black shadow-lg dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300'
                    >
                        Profiles were filled in with AI and can be inaccurate. Open a
                        ticket and it will be corrected as soon as possible.
                        {onReport ? (
                            <button
                                type='button'
                                onClick={() => {
                                    setPinned(false)
                                    setOpen(false)
                                    onReport()
                                }}
                                className='mt-2 block cursor-pointer rounded-full px-1.5 py-1 font-semibold text-pink-600 transition-colors hover:bg-pink-100 hover:text-pink-500 dark:hover:bg-pink-500/15'
                            >
                                Report a mistake
                            </button>
                        ) : null}
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

export default function ColorLegend() {
    const { colorblind, attributeIcons } = useColorblind()
    const palette = feedbackPalette(colorblind)

    return (
        <div className={`mt-6 ${proximaNova.className}`}>
            <div className='mt-3 flex flex-nowrap items-start justify-center gap-3'>
                {ITEMS.map((item) => (
                    <div key={item.label} className='flex w-14 flex-col items-center gap-1'>
                        <div className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded text-white ${palette[item.tone]}`}>
                            {item.direction ? (
                                <span
                                    aria-hidden
                                    className='h-8 w-8 bg-black/60 mask-contain mask-center mask-no-repeat'
                                    style={{
                                        maskImage: 'url(/icons/arrow.svg)',
                                        WebkitMaskImage: 'url(/icons/arrow.svg)',
                                        transform: item.direction === 'down' ? 'rotate(180deg) scale(1.35)' : 'scale(1.35)',
                                    }}
                                />
                            ) : attributeIcons && item.mark ? (
                                <FeedbackIcon mark={item.mark} className='h-5 w-5' />
                            ) : null}
                        </div>
                        <span className='whitespace-pre-line text-center text-xs leading-tight text-black dark:text-white'>
                            {item.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
