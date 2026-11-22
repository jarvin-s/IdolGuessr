import type { AttributeStatus } from '@/lib/classic'
import { COUNTRIES } from '@/components/classic/countries'
import { motion } from 'motion/react'
import Image from 'next/image'

const TONE: Record<AttributeStatus, string> = {
    correct: 'bg-[#3aa346]',
    partial: 'bg-[#e39b2b]',
    wrong: 'bg-[#d64545]',
    higher: 'bg-[#d64545]',
    lower: 'bg-[#d64545]',
}

function formatHeight(value: string | number) {
    const cm = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(cm)) return String(value)
    const totalInches = Math.round(cm / 2.54)
    const feet = Math.floor(totalInches / 12)
    const inches = totalInches % 12
    return `${cm}cm/${feet}'${inches}`
}

function NationalityValue({ value, matched }: { value: string; matched?: string[] }) {
    const parts = value.split(',').map((part) => part.trim()).filter(Boolean)
    const hits = new Set((matched ?? []).map((part) => part.trim().toLowerCase()))
    const split = parts.length > 1 && hits.size > 0 && parts.some((part) => !hits.has(part.toLowerCase()))
    return (
        <span className='flex flex-col items-center gap-1'>
            {parts.map((part) => {
                const country = COUNTRIES[part]
                const correct = split && hits.has(part.toLowerCase())
                const fade = split && !correct ? 'opacity-40' : ''
                const label = country?.name ?? part
                const labelClass = correct
                    ? 'rounded-md bg-green-600 px-1.5 py-0.5 text-xs leading-none font-semibold text-white'
                    : 'text-xs leading-none'
                if (!country) {
                    return (
                        <span key={part} className={fade}>
                            <span className={labelClass}>{label}</span>
                        </span>
                    )
                }
                return (
                    <span key={part} className={`flex flex-col items-center gap-0.5 ${fade}`}>
                        <Image
                            src={`/flags/${country.code}.svg`}
                            alt={country.name}
                            width={0}
                            height={0}
                            className='w-10 h-10'
                        />
                        <span className={labelClass}>{label}</span>
                    </span>
                )
            })}
        </span>
    )
}

export function formatAttribute(key: string, value: string | number | null) {
    if (value == null || value === '') return '—'
    if (key === 'height') return formatHeight(value)
    return String(value)
}

export default function AttributeCell({
    column,
    value,
    status,
    matched,
    animate = false,
    flipMs = 850,
    delay = 0,
    onFlipEnd,
}: {
    column: string
    value: string | number | null
    status: AttributeStatus
    matched?: string[]
    animate?: boolean
    flipMs?: number
    delay?: number
    onFlipEnd?: () => void
}) {
    const direction = status === 'higher' ? 'up' : status === 'lower' ? 'down' : null
    const showNationality = column === 'nationality' && typeof value === 'string' && value !== ''

    return (
        <motion.div
            className='relative h-30 w-full'
            style={{ transformStyle: 'preserve-3d' }}
            initial={animate ? { rotateY: 180 } : false}
            animate={{ rotateY: 0 }}
            transition={{ duration: flipMs / 1000, delay: delay / 1000, ease: 'easeInOut' }}
            onAnimationComplete={animate ? onFlipEnd : undefined}
        >
            <div
                className={`absolute inset-0 flex items-center justify-center overflow-hidden rounded-md px-2 text-center text-sm font-semibold text-white ${TONE[status]}`}
                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
            >
                {direction && (
                    <span
                        aria-hidden
                        className='pointer-events-none absolute inset-0 bg-black/60 mask-contain mask-center mask-no-repeat'
                        style={{
                            maskImage: 'url(/icons/arrow.svg)',
                            WebkitMaskImage: 'url(/icons/arrow.svg)',
                            transform: direction === 'down' ? 'rotate(180deg) scale(1.45)' : 'scale(1.45)',
                        }}
                    />
                )}
                <span className='relative z-10 min-w-0 leading-tight wrap-break-word'>
                    {showNationality ? (
                        <NationalityValue value={value} matched={matched} />
                    ) : (
                        formatAttribute(column, value)
                    )}
                </span>
            </div>
            {animate && (
                <div
                    aria-hidden
                    className='absolute inset-0 rounded-md border border-zinc-300 bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800'
                    style={{
                        transform: 'rotateY(180deg)',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                    }}
                />
            )}
        </motion.div>
    )
}
