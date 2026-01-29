import { useState } from 'react'
import localFont from 'next/font/local'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

interface InfoModalProps {
    isOpen: boolean
    onClose: () => void
    onShowFeedback: () => void
    onShowHelp: () => void
    onShowHistory: () => void
    gameMode?: 'daily' | 'unlimited' | 'hangul'
}

export default function InfoModal({
    isOpen,
    onClose,
    onShowFeedback,
    onShowHelp,
    onShowHistory,
    gameMode = 'daily',
}: InfoModalProps) {
    const [showChangelog, setShowChangelog] = useState(false)

    if (!isOpen) return null

    return (
        <div className='bg-opacity-50 fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6'>
                <button
                    onClick={onClose}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200'
                    aria-label='Close Info'
                >
                    <svg
                        className='h-4 w-4 text-gray-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M6 18L18 6M6 6l12 12'
                        />
                    </svg>
                </button>

                {showChangelog ? (
                    <>
                        <div className='mb-6 flex items-center gap-2'>
                            <button
                                onClick={() => setShowChangelog(false)}
                                className='flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-100 px-3 transition-colors hover:bg-gray-200'
                                aria-label='Go back'
                            >
                                <ArrowLeftIcon />
                                <span className='text-sm text-gray-600'>
                                    Go back
                                </span>
                            </button>
                        </div>
                        <h1
                            className={`${proximaNovaBold.className} text-2xl uppercase`}
                        >
                            Changelog
                        </h1>
                        <div className='mt-4 space-y-4'>
                            <ChangelogEntry
                                version='1.4.0'
                                date='January 29, 2025'
                                changes={['Launched Challenge links',
                                    'Added past idol history to Daily mode',
                                    'Added Gen filter to Infinite mode'
                                ]}
                            />
                            <ChangelogEntry
                                version='1.3.0'
                                date='January 11, 2025'
                                changes={[
                                    'Launched Hangul mode',
                                    'Added Info screen',
                                    'Added restricted guessing to only idol names',
                                ]}
                            />
                            <ChangelogEntry
                                version='1.2.0'
                                date='December 11, 2025'
                                changes={[
                                    'Added group filters to Infinite mode',
                                ]}
                            />
                            <ChangelogEntry
                                version='1.1.0'
                                date='November 1, 2025'
                                changes={['Launched Infinite mode']}
                            />
                            <ChangelogEntry
                                version='1.0.0'
                                date='October 21, 2025'
                                changes={['Initial release']}
                            />
                        </div>
                    </>
                ) : (
                    <>
                        <h1
                            className={`${proximaNovaBold.className} text-2xl uppercase`}
                        >
                            Info
                        </h1>
                        <p className='mt-2 text-gray-600'>
                            Get help, send feedback, or see what&apos;s new.
                        </p>

                        <div className='mt-6 space-y-3'>
                            <button
                                onClick={onShowHelp}
                                className='flex w-full cursor-pointer items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50'
                            >
                                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100'>
                                    <HelpIcon />
                                </div>
                                <div className='text-left'>
                                    <h3
                                        className={`${proximaNovaBold.className} text-lg`}
                                    >
                                        How to play
                                    </h3>
                                    <p className='text-sm text-gray-500'>
                                        Learn the game rules
                                    </p>
                                </div>
                                <ChevronRightIcon />
                            </button>

                            <button
                                onClick={onShowFeedback}
                                className='flex w-full cursor-pointer items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50'
                            >
                                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100'>
                                    <FeedbackIcon />
                                </div>
                                <div className='text-left'>
                                    <h3
                                        className={`${proximaNovaBold.className} text-lg`}
                                    >
                                        Send feedback
                                    </h3>
                                    <p className='text-sm text-gray-500'>
                                        Report bugs or suggest features
                                    </p>
                                </div>
                                <ChevronRightIcon />
                            </button>

                            <button
                                onClick={() => setShowChangelog(true)}
                                className='flex w-full cursor-pointer items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50'
                            >
                                <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100'>
                                    <ChangelogIcon />
                                </div>
                                <div className='text-left'>
                                    <h3
                                        className={`${proximaNovaBold.className} text-lg`}
                                    >
                                        Changelog
                                    </h3>
                                    <p className='text-sm text-gray-500'>
                                        See what&apos;s new in IdolGuessr
                                    </p>
                                </div>
                                <ChevronRightIcon />
                            </button>

                            {gameMode === 'daily' && (
                                <button
                                    onClick={onShowHistory}
                                    className='flex w-full cursor-pointer items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50'
                                >
                                    <div className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100'>
                                        <HistoryIcon />
                                    </div>
                                    <div className='text-left'>
                                        <h3
                                            className={`${proximaNovaBold.className} text-lg`}
                                        >
                                            Past idols
                                        </h3>
                                        <p className='text-sm text-gray-500'>
                                            Play idols from previous days
                                        </p>
                                    </div>
                                    <ChevronRightIcon />
                                </button>
                            )}
                        </div>

                        <div className='mt-6 flex justify-center gap-4 border-t border-gray-200 pt-4'>
                            <a
                                href='https://youtube.com/@idolguessr'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center justify-center transition-opacity hover:opacity-70'
                                aria-label='Follow us on YouTube'
                            >
                                <YouTubeIcon />
                            </a>
                            <a
                                href='https://instagram.com/idolguessr.fun'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center justify-center transition-opacity hover:opacity-70'
                                aria-label='Follow us on Instagram'
                            >
                                <InstagramIcon />
                            </a>
                            <a
                                href='https://tiktok.com/@idolguessr.fun'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center justify-center transition-opacity hover:opacity-70'
                                aria-label='Follow us on TikTok'
                            >
                                <TikTokIcon />
                            </a>
                            <a
                                href='https://x.com/idolguessr'
                                target='_blank'
                                rel='noopener noreferrer'
                                className='flex items-center justify-center transition-opacity hover:opacity-70'
                                aria-label='Follow us on Twitter'
                            >
                                <TwitterIcon />
                            </a>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

function ChangelogEntry({
    version,
    date,
    changes,
}: {
    version: string
    date: string
    changes: string[]
}) {
    return (
        <div className='border-l-2 border-gray-200 pl-4'>
            <div className='flex items-center gap-2'>
                <span className='font-bold text-black'>v{version}</span>
                <span className='text-sm text-gray-400'>{date}</span>
            </div>
            <ul className='mt-2 space-y-1'>
                {changes.map((change, i) => (
                    <li key={i} className='text-sm text-gray-600'>
                        • {change}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function ArrowLeftIcon() {
    return (
        <svg
            className='h-4 w-4 text-gray-600'
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
    )
}

function HelpIcon() {
    return (
        <svg
            className='h-5 w-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <circle cx='12' cy='12' r='10' strokeWidth='2' />
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01'
            />
        </svg>
    )
}

function FeedbackIcon() {
    return (
        <svg
            className='h-5 w-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
            />
        </svg>
    )
}

function ChangelogIcon() {
    return (
        <svg
            className='h-5 w-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
            />
        </svg>
    )
}

function ChevronRightIcon() {
    return (
        <svg
            className='ml-auto h-5 w-5 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
            />
        </svg>
    )
}

function InstagramIcon() {
    return (
        <svg
            className='h-6 w-6 text-gray-600'
            fill='currentColor'
            viewBox='0 0 24 24'
        >
            <path d='M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z' />
        </svg>
    )
}

function TikTokIcon() {
    return (
        <svg
            className='h-6 w-6 text-gray-600'
            fill='currentColor'
            viewBox='0 0 24 24'
        >
            <path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z' />
        </svg>
    )
}

function YouTubeIcon() {
    return (
        <svg
            className='h-6 w-6 text-gray-600'
            fill='currentColor'
            viewBox='0 0 512 512'
        >
            <path fill='currentColor' d='M508.64 148.79c0-45-33.1-81.2-74-81.2C379.24 65 322.74 64 265 64h-18c-57.6 0-114.2 1-169.6 3.6C36.6 67.6 3.5 104 3.5 149C1 184.59-.06 220.19 0 255.79q-.15 53.4 3.4 106.9c0 45 33.1 81.5 73.9 81.5c58.2 2.7 117.9 3.9 178.6 3.8q91.2.3 178.6-3.8c40.9 0 74-36.5 74-81.5c2.4-35.7 3.5-71.3 3.4-107q.34-53.4-3.26-106.9M207 353.89v-196.5l145 98.2Z' />
        </svg>
    )
}

function HistoryIcon() {
    return (
        <svg
            className='h-5 w-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            strokeWidth={2}
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M4 4v5h5'
            />
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                d='M4.51 9A9 9 0 1 0 6 6L4 9'
            />
        </svg>
    )
}

function TwitterIcon() {
    return (
        <svg
            className='h-6 w-6 text-gray-600'
            fill='currentColor'
            viewBox='0 0 24 24'
        >
            <path fill='currentColor' d='M22.46 6c-.77.35-1.6.58-2.46.69c.88-.53 1.56-1.37 1.88-2.38c-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29c0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15c0 1.49.75 2.81 1.91 3.56c-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.2 4.2 0 0 1-1.93.07a4.28 4.28 0 0 0 4 2.98a8.52 8.52 0 0 1-5.33 1.84q-.51 0-1.02-.06C3.44 20.29 5.7 21 8.12 21C16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56c.84-.6 1.56-1.36 2.14-2.23' />
        </svg>
    )
}