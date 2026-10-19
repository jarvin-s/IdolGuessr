import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import localFont from 'next/font/local'
import ThemeToggle from '@/components/theme/ThemeToggle'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

export const metadata: Metadata = {
    title: 'Changelog',
    description: "See what's new in IdolGuessr",
}

const entries: { date: string; changes: string[] }[] = [
    {
        date: 'October 20, 2026',
        changes: ['Added on-screen keyboard toggle'],
    },
    {
        date: 'October 12, 2026',
        changes: ['Added FAQ section', 'Added Dark mode'],
    },
    {
        date: 'October 6, 2026',
        changes: ['Added difficulty levels to Infinite mode (Easy, Normal, Hard, Challenger)'],
    },
    {
        date: 'September 28, 2026',
        changes: ['Added ticketing feedback system'],
    },
    {
        date: 'June 9, 2026',
        changes: [
            'Fixed a bug in the hangul mode where users could not type numbers',
            "Added today's player count",
        ],
    },
    {
        date: 'January 29, 2026',
        changes: [
            'Launched Challenge links',
            'Added past idol history to Daily mode',
            'Added Gen filter to Infinite mode',
        ],
    },
    {
        date: 'January 11, 2026',
        changes: [
            'Launched Hangul mode',
            'Added Info screen',
            'Added restricted guessing to only idol names',
        ],
    },
    {
        date: 'December 11, 2025',
        changes: ['Added group filters to Infinite mode'],
    },
    {
        date: 'November 1, 2025',
        changes: ['Launched Infinite mode'],
    },
    {
        date: 'October 21, 2025',
        changes: ['Initial release'],
    },
]

export default function ChangelogPage() {
    return (
        <main className='min-h-screen bg-white dark:bg-zinc-950'>
            <div className='mx-auto w-full max-w-md px-6 py-8'>
                <div className='mb-6 flex items-center justify-between'>
                    <Link
                        href='/'
                        className='flex h-8 items-center justify-center gap-2 rounded-full bg-gray-100 dark:bg-zinc-800 px-3 transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700'
                    >
                        <svg
                            className='h-4 w-4 text-gray-600 dark:text-zinc-400'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                        >
                            <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M10 19l-7-7m0 0l7-7m-7 7h18'
                            />
                        </svg>
                        <span className='text-sm text-gray-600 dark:text-zinc-400'>
                            Back to game
                        </span>
                    </Link>
                    <Image
                        src='/images/idolguessr-logo.png'
                        alt='IdolGuessr Logo'
                        width={150}
                        height={50}
                        className='h-10 w-auto dark:invert'
                    />
                </div>

                <div className='mb-6 flex justify-center'>
                    <ThemeToggle />
                </div>

                <h1
                    className={`${proximaNovaBold.className} text-4xl uppercase`}
                >
                    Changelog
                </h1>
                <p className='mt-2 text-gray-600 dark:text-zinc-400'>
                    See what&apos;s new in IdolGuessr.
                </p>

                <div className='mt-8 space-y-4'>
                    {entries.map((entry) => (
                        <div
                            key={entry.date}
                            className='border-l-2 border-gray-200 dark:border-zinc-700 pl-4'
                        >
                            <span className='text-md font-bold text-pink-400'>
                                {entry.date}
                            </span>
                            <ul className='mt-2 space-y-1'>
                                {entry.changes.map((change) => (
                                    <li
                                        key={change}
                                        className='text-md text-gray-600 dark:text-zinc-400'
                                    >
                                        • {change}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    )
}
