'use client'

import { useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { COUNTRIES } from '@/components/classic/countries'
import FeedbackIcon, { type FeedbackMark } from '@/components/theme/FeedbackIcon'
import { useColorblind } from '@/components/theme/ColorblindProvider'
import { feedbackPalette, type FeedbackTone } from '@/lib/feedbackPalette'
import { getImageUrl } from '@/lib/supabase'

type Tab = 'play' | 'attributes'

type Tone = Extract<FeedbackTone, 'correct' | 'partial' | 'wrong'>

function NationalityFlags({ value, matched, matchedClass }: { value: string; matched?: string[]; matchedClass: string }) {
    const parts = value.split(',').map((part) => part.trim()).filter(Boolean)
    const hits = new Set((matched ?? []).map((part) => part.trim().toLowerCase()))
    const split = parts.length > 1 && hits.size > 0 && parts.some((part) => !hits.has(part.toLowerCase()))
    return (
        <span className='flex items-start justify-center gap-1'>
            {parts.map((part) => {
                const country = COUNTRIES[part]
                const correct = split && hits.has(part.toLowerCase())
                const fade = split && !correct ? 'opacity-40' : ''
                return (
                    <span key={part} className={`flex flex-col items-center gap-0.5 ${fade}`}>
                        {country ? (
                            <Image
                                src={`/flags/${country.code}.svg`}
                                alt={country.name}
                                width={32}
                                height={32}
                                className='h-8 w-8'
                            />
                        ) : null}
                        <span className={correct ? `rounded-md px-1 py-0.5 text-[10px] leading-none font-semibold text-white ${matchedClass}` : 'text-[10px] leading-none font-semibold'}>
                            {country?.name ?? part}
                        </span>
                    </span>
                )
            })}
        </span>
    )
}

function Tile({
    label,
    value,
    tone,
    arrow,
    matched,
}: {
    label: string
    value: string
    tone: Tone
    arrow?: 'up' | 'down'
    matched?: string[]
}) {
    const { colorblind, attributeIcons } = useColorblind()
    const palette = feedbackPalette(colorblind)
    const mark: FeedbackMark | null = attributeIcons && !arrow ? tone : null
    return (
        <div className={`relative flex h-30 w-[7.5rem] shrink-0 flex-col items-center justify-center overflow-hidden rounded-md px-2 text-center text-white ${palette[tone]}`}>
            {arrow && (
                <span
                    aria-hidden
                    className='pointer-events-none absolute inset-0 bg-black/60 mask-contain mask-center mask-no-repeat'
                    style={{
                        maskImage: 'url(/icons/arrow.svg)',
                        WebkitMaskImage: 'url(/icons/arrow.svg)',
                        transform: arrow === 'down' ? 'rotate(180deg) scale(1.45)' : 'scale(1.45)',
                    }}
                />
            )}
            {mark && (
                <span className='absolute top-1 right-1 z-10 text-white'>
                    <FeedbackIcon mark={mark} className='h-3.5 w-3.5' />
                </span>
            )}
            <span className='relative z-10 text-[11px] leading-none font-medium text-white/80'>{label}</span>
            {label === 'Nationality' ? (
                <span className='relative z-10 mt-1'>
                    <NationalityFlags value={value} matched={matched} matchedClass={palette.matched} />
                </span>
            ) : (
                <span className='relative z-10 mt-1 text-sm leading-tight font-bold'>{value}</span>
            )}
        </div>
    )
}

const PORTRAITS: Record<string, { bucket: string; group: string }> = {
    Jennie: { bucket: 'SmVubmll-001', group: 'QkxBQ0tQSU5L' },
    Winter: { bucket: 'V2ludGVy-001', group: 'YWVzcGE' },
    Karina: { bucket: 'S2FyaW5h-001', group: 'YWVzcGE' },
}

function portraitUrl(name: string) {
    const portrait = PORTRAITS[name]
    if (!portrait) return ''
    return getImageUrl('', portrait.bucket, 'clear', 'unlimited', 'girl-group', portrait.group)
}

function Example({
    step,
    title,
    name,
    tiles,
    notes,
    showSearch = false,
}: {
    step: string
    title: string
    name: string
    tiles: Array<{ label: string; value: string; tone: Tone; arrow?: 'up' | 'down'; matched?: string[] }>
    notes?: Array<{ tone: Tone; text: string }>
    showSearch?: boolean
}) {
    const portrait = portraitUrl(name)
    const { colorblind } = useColorblind()
    const palette = feedbackPalette(colorblind)
    return (
        <section>
            <p className='text-base font-bold tracking-[0.14em] text-gray-400 uppercase dark:text-zinc-500'>{step}</p>
            <h3 className='mt-1 text-base font-bold text-black dark:text-zinc-100'>{title}</h3>
            <div className='mt-3 rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-950'>
                {showSearch && (
                    <div className='mb-4 flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm'>
                        <span className='min-w-0 flex-1 truncate text-sm font-medium text-zinc-900'>{name}</span>
                        <svg className='h-5 w-5 shrink-0 text-zinc-500' fill='none' stroke='currentColor' viewBox='0 0 24 24' aria-hidden>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z' />
                        </svg>
                    </div>
                )}
                <div className='mb-3 flex items-center gap-3 justify-center'>
                    {portrait ? (
                        <Image
                            src={portrait}
                            alt={name}
                            width={80}
                            height={80}
                            className='h-32 w-32 rounded-full object-cover'
                            unoptimized
                        />
                    ) : null}
                    <p className='text-2xl font-bold text-black dark:text-white'>{name}</p>
                </div>
                <div className='grid grid-cols-2 justify-items-center gap-1.5'>
                    {tiles.map((tile) => (
                        <Tile key={tile.label} {...tile} />
                    ))}
                </div>
                {notes && notes.length > 0 && (
                    <ul className='mt-3 space-y-1.5'>
                        {notes.map((note) => (
                            <li key={note.text} className='flex items-start gap-2 text-sm leading-snug text-gray-600 dark:text-zinc-300'>
                                <span className={`mt-0.5 h-3 w-3 shrink-0 rounded-sm ${palette[note.tone]}`} />
                                <span>{note.text}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </section>
    )
}

const ATTRIBUTES: Array<{
    name: string
    text: string
    tiles: Array<{ label: string; value: string; tone: Tone; arrow?: 'up' | 'down'; matched?: string[] }>
}> = [
    {
        name: 'Group',
        text: 'A check when the idol is in the same group.',
        tiles: [
            { label: 'Group', value: 'aespa', tone: 'correct' },
            { label: 'Group', value: 'BLACKPINK', tone: 'wrong' },
        ],
    },
    {
        name: 'Gender',
        text: 'A check when the idol has the same gender. Co-ed groups show Mixed.',
        tiles: [
            { label: 'Gender', value: 'Female', tone: 'correct' },
            { label: 'Gender', value: 'Male', tone: 'wrong' },
            { label: 'Gender', value: 'Mixed', tone: 'wrong' },
        ],
    },
    {
        name: 'Generation',
        text: 'A check when it matches. An up arrow means the idol is a later generation (higher number), and a down arrow means an earlier one (lower number).',
        tiles: [
            { label: 'Gen', value: '4', tone: 'correct' },
            { label: 'Gen', value: '3', tone: 'wrong', arrow: 'up' },
            { label: 'Gen', value: '5', tone: 'wrong', arrow: 'down' },
        ],
    },
    {
        name: 'Agency',
        text: 'A check when the idol is in the same agency. A half-mark when the agency shares a parent agency.',
        tiles: [
            { label: 'Agency', value: 'SM Entertainment', tone: 'correct' },
            { label: 'Agency', value: 'HYBE', tone: 'partial' },
            { label: 'Agency', value: 'YG', tone: 'wrong' },
        ],
    },
    {
        name: 'Nationality',
        text: 'A check when the idol is from the same nationality. A half-mark when at least one nationality matches. A matching flag stays bright when there are several.',
        tiles: [
            { label: 'Nationality', value: 'Korean', tone: 'correct' },
            { label: 'Nationality', value: 'Korean, Chinese', tone: 'partial', matched: ['Korean'] },
            { label: 'Nationality', value: 'Japanese', tone: 'wrong' },
        ],
    },
    {
        name: 'Positions',
        text: 'A check when the idol has the same positions. A half-mark when at least one position is shared.',
        tiles: [
            { label: 'Positions', value: 'Vocalist', tone: 'correct' },
            { label: 'Positions', value: 'Rapper', tone: 'partial' },
            { label: 'Positions', value: 'Dancer', tone: 'wrong' },
        ],
    },
    {
        name: 'Birth year',
        text: 'A check when the year matches. An up arrow means the idol is younger (lower number), and a down arrow means older (higher number).',
        tiles: [
            { label: 'Birth year', value: '2000', tone: 'correct' },
            { label: 'Birth year', value: '1996', tone: 'wrong', arrow: 'up' },
            { label: 'Birth year', value: '2004', tone: 'wrong', arrow: 'down' },
        ],
    },
    {
        name: 'Height',
        text: 'A check when the height matches. An up arrow means the idol is taller, and a down arrow means shorter.',
        tiles: [
            { label: 'Height', value: '168cm', tone: 'correct' },
            { label: 'Height', value: '160cm', tone: 'wrong', arrow: 'up' },
            { label: 'Height', value: '175cm', tone: 'wrong', arrow: 'down' },
        ],
    },
]

export default function ClassicHelpModal({
    isOpen,
    onClose,
}: {
    isOpen: boolean
    onClose: () => void
    onBack?: () => void
}) {
    const [tab, setTab] = useState<Tab>('play')

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-[650] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 dark:bg-zinc-900'>
                <div className='mb-4 flex items-center gap-3'>
                    <h1 className='text-xl font-bold text-black dark:text-zinc-100'>How to play</h1>
                    <button
                        onClick={onClose}
                        className='ml-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        aria-label='Close Help'
                    >
                        <svg className='h-4 w-4 text-gray-600 dark:text-zinc-400' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                        </svg>
                    </button>
                </div>

                <div className='grid grid-cols-2 rounded-full bg-gray-100 p-1 dark:bg-zinc-800'>
                    {(
                        [
                            ['play', 'How to play'],
                            ['attributes', 'Attributes'],
                        ] as const
                    ).map(([id, label]) => (
                        <button
                            key={id}
                            type='button'
                            onClick={() => setTab(id)}
                            className={`cursor-pointer rounded-full py-2 text-sm font-bold transition-colors ${
                                tab === id
                                    ? 'bg-pink-600 text-white'
                                    : 'text-gray-500 hover:text-black dark:text-zinc-400 dark:hover:text-white'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode='wait'>
                    {tab === 'play' ? (
                        <motion.div
                            key='play'
                            className='mt-5 space-y-5'
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div>
                                <h2 className='text-lg font-bold text-black dark:text-zinc-100'>Guess the idol from their attributes.</h2>
                                <p className='mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300'>
                                    Each guess reveals the idol&apos;s attributes, and the tiles show how close you are.
                                </p>
                                <p className='mt-2 text-sm leading-relaxed text-gray-600 dark:text-zinc-300'>
                                    In the daily, Give up appears after your 3rd guess. It reveals the answer and ends the round. In infinite, Reveal sits above the grid. It shows the answer and resets your streak. A correct guess keeps the streak and updates your average guesses.
                                </p>
                            </div>

                            <Example
                                step='Step 1'
                                title='Guess an idol using the search bar.'
                                name='Jennie'
                                showSearch
                                tiles={[
                                    { label: 'Group', value: 'BLACKPINK', tone: 'wrong' },
                                    { label: 'Gender', value: 'Female', tone: 'correct' },
                                    { label: 'Gen', value: '3', tone: 'wrong', arrow: 'up' },
                                    { label: 'Positions', value: 'Rapper', tone: 'partial' },
                                    { label: 'Nationality', value: 'Korean', tone: 'correct' },
                                    { label: 'Birth year', value: '1996', tone: 'wrong', arrow: 'up' },
                                ]}
                                notes={[
                                    { tone: 'correct', text: 'Female and Korean match the idol.' },
                                    { tone: 'partial', text: 'A half-mark is a partial match, such as a shared position or one of two countries.' },
                                    { tone: 'wrong', text: 'An up arrow means the idol is a later generation (higher number), younger, or taller.' },
                                ]}
                            />

                            <Example
                                step='Step 2'
                                title='Use the tiles to get closer.'
                                name='Winter'
                                showSearch
                                tiles={[
                                    { label: 'Group', value: 'aespa', tone: 'correct' },
                                    { label: 'Gender', value: 'Female', tone: 'correct' },
                                    { label: 'Gen', value: '4', tone: 'correct' },
                                    { label: 'Agency', value: 'SM Entertainment', tone: 'correct' },
                                    { label: 'Nationality', value: 'Korean', tone: 'correct' },
                                    { label: 'Birth year', value: '2001', tone: 'wrong', arrow: 'down' },
                                ]}
                                notes={[
                                    { tone: 'correct', text: 'Group, gender, generation, agency, and nationality all match.' },
                                    { tone: 'wrong', text: '2001 is too recent. The idol was born earlier (lower number).' },
                                ]}
                            />

                            <Example
                                step='Step 3'
                                title='Keep going until you guess the idol. A new idol appears every day.'
                                name='Karina'
                                showSearch
                                tiles={[
                                    { label: 'Group', value: 'aespa', tone: 'correct' },
                                    { label: 'Gender', value: 'Female', tone: 'correct' },
                                    { label: 'Gen', value: '4', tone: 'correct' },
                                    { label: 'Agency', value: 'SM Entertainment', tone: 'correct' },
                                    { label: 'Nationality', value: 'Korean', tone: 'correct' },
                                    { label: 'Birth year', value: '2000', tone: 'correct' },
                                ]}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            key='attributes'
                            className='mt-5 space-y-3'
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.2 }}
                        >
                            {ATTRIBUTES.map((attribute) => (
                                <div key={attribute.name} className='rounded-xl bg-gray-100 px-4 py-3 dark:bg-zinc-800'>
                                    <p className='text-lg font-bold text-black dark:text-zinc-100'>{attribute.name}</p>
                                    <p className='mt-1 text-sm leading-relaxed text-gray-600 dark:text-zinc-300'>{attribute.text}</p>
                                    <div className='mt-3 grid grid-cols-2 justify-items-center gap-1.5'>
                                        {attribute.tiles.map((tile) => (
                                            <Tile key={`${tile.value}-${tile.tone}-${tile.arrow ?? ''}`} {...tile} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
