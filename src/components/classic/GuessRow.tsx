import Image from 'next/image'
import AttributeCell from '@/components/classic/AttributeCell'
import { idolPortrait, type ClassicFeedback } from '@/lib/classic'
import { GUESS_COLUMNS } from '@/components/classic/columns'

const FLIP_MS = 850
const FLIP_STAGGER_MS = 160

export const CLASSIC_REVEAL_MS = FLIP_MS + FLIP_STAGGER_MS * (GUESS_COLUMNS.length - 1)

export default function GuessRow({
    guess,
    animate = false,
    onRevealEnd,
}: {
    guess: ClassicFeedback
    animate?: boolean
    onRevealEnd?: () => void
}) {
    const portrait = idolPortrait(guess)

    return (
        <div className='contents'>
            <div className='relative h-30 w-full overflow-hidden rounded-md border border-zinc-300 bg-zinc-900 dark:border-zinc-700'>
                {portrait ? (
                    <Image
                        src={portrait}
                        alt=''
                        width={120}
                        height={120}
                        className='h-full w-full object-cover'
                        unoptimized
                    />
                ) : (
                    <div className='h-full w-full bg-zinc-200 dark:bg-zinc-800' />
                )}
                <span className='absolute bottom-0 left-1/2 max-w-[calc(100%-0.75rem)] -translate-x-1/2 truncate bg-pink-700 px-1.5 py-0.5 text-center text-xs rounded-t-md font-semibold text-white'>
                    {guess.name}
                </span>
            </div>
            {GUESS_COLUMNS.map((column, index) => (
                <AttributeCell
                    key={column.key}
                    column={column.key}
                    value={guess[column.key].value}
                    status={guess[column.key].status}
                    animate={animate}
                    flipMs={FLIP_MS}
                    delay={animate ? FLIP_STAGGER_MS * index : 0}
                    onFlipEnd={index === GUESS_COLUMNS.length - 1 ? onRevealEnd : undefined}
                />
            ))}
        </div>
    )
}
