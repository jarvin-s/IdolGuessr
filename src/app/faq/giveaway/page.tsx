import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import localFont from 'next/font/local'

const proximaNovaBold = localFont({
    src: '../../../../public/fonts/proximanova_bold.otf',
})

export const metadata: Metadata = {
    title: 'Giveaway FAQ',
    description:
        'How the IdolGuessr daily idol giveaway works, and what to do if you win.',
}

interface FaqItem {
    question: string
    answer: ReactNode
    plainAnswer: string
}

interface FaqSection {
    title: string
    items: FaqItem[]
}

const sections: FaqSection[] = [
    {
        title: 'How it works',
        items: [
            {
                question: 'How do I enter?',
                plainAnswer:
                    'When a giveaway is open, a gift button appears on the Daily page. Enter once with your Instagram or TikTok username. We message the winner on that account.',
                answer: (
                    <p>
                        When a giveaway is open, a gift button appears on the
                        Daily page. Enter once with your Instagram or TikTok
                        username. We message the winner on that account.
                    </p>
                ),
            },
            {
                question: 'How is the winner chosen?',
                plainAnswer:
                    'After the giveaway closes, one entry is drawn at random.',
                answer: (
                    <p>
                        After the giveaway closes, one entry is drawn at
                        random.
                    </p>
                ),
            },
            {
                question: 'What do I win?',
                plainAnswer:
                    "You pick the idol photo for one day. On that day, the Daily page shows that today's idol was chosen by you.",
                answer: (
                    <p>
                        You pick the idol photo for one day. On that day, the
                        Daily page shows that today&apos;s idol was chosen by
                        you.
                    </p>
                ),
            },
        ],
    },
    {
        title: 'If you win',
        items: [
            {
                question: 'What kind of photo should I send?',
                plainAnswer:
                    "A modern selfie works best. The idol's face should be clear, and the photo should not be zoomed out.",
                answer: (
                    <ul className='list-disc space-y-1 pl-5'>
                        <li>A modern selfie works best.</li>
                        <li>The idol&apos;s face should be clear.</li>
                        <li>The photo should not be zoomed out.</li>
                    </ul>
                ),
            },
            {
                question: 'How do I send the photos?',
                plainAnswer:
                    'Open the Info menu, choose Send feedback, and send a few photos in the ticket. Links to the images are fine. We pick the best one.',
                answer: (
                    <p>
                        Open the Info menu, choose{' '}
                        <strong>Send feedback</strong>, and send a few photos
                        in the ticket. Links to the images are fine. We pick
                        the best one.
                    </p>
                ),
            },
            {
                question: 'How do I get credited?',
                plainAnswer:
                    'In the same ticket, tell us the name to show and a link to your Instagram or TikTok. For example, @yourname and https://instagram.com/yourname.',
                answer: (
                    <p>
                        In the same ticket, tell us the name to show and a link
                        to your Instagram or TikTok. For example,{' '}
                        <strong>@yourname</strong> and{' '}
                        <strong>https://instagram.com/yourname</strong>.
                    </p>
                ),
            },
        ],
    },
]

const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: sections.flatMap((section) =>
        section.items.map((item) => ({
            '@type': 'Question',
            name: item.question,
            acceptedAnswer: { '@type': 'Answer', text: item.plainAnswer },
        }))
    ),
}

export default function GiveawayFaqPage() {
    return (
        <main className='min-h-screen bg-white dark:bg-zinc-950'>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <div className='mx-auto w-full max-w-md px-6 py-8'>
                <div className='mb-6 flex items-center justify-between'>
                    <Link
                        href='/'
                        className='flex h-8 items-center justify-center gap-2 rounded-full bg-gray-100 px-3 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
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

                <h1
                    className={`${proximaNovaBold.className} text-4xl uppercase`}
                >
                    Giveaway
                </h1>
                <p className='mt-2 text-gray-600 dark:text-zinc-400'>
                    How the daily idol giveaway works, and what to do if you
                    win.
                </p>

                <div className='mt-8 space-y-8'>
                    {sections.map((section) => (
                        <section key={section.title}>
                            <h2
                                className={`${proximaNovaBold.className} mb-3 text-xl uppercase`}
                            >
                                {section.title}
                            </h2>
                            <div className='space-y-2'>
                                {section.items.map((item) => (
                                    <details
                                        key={item.question}
                                        className='group rounded-lg border border-gray-200 transition-colors open:bg-gray-50 dark:border-zinc-700 dark:open:bg-zinc-800'
                                    >
                                        <summary className='flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-bold [&::-webkit-details-marker]:hidden'>
                                            {item.question}
                                            <svg
                                                className='h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180 dark:text-zinc-500'
                                                fill='none'
                                                stroke='currentColor'
                                                viewBox='0 0 24 24'
                                            >
                                                <path
                                                    strokeLinecap='round'
                                                    strokeLinejoin='round'
                                                    strokeWidth={2}
                                                    d='M19 9l-7 7-7-7'
                                                />
                                            </svg>
                                        </summary>
                                        <div className='px-4 pb-4 text-gray-600 dark:text-zinc-400'>
                                            {item.answer}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>

                <p className='mt-8 text-sm text-gray-500 dark:text-zinc-500'>
                    More answers are on the{' '}
                    <Link href='/faq' className='underline'>
                        main FAQ
                    </Link>
                    .
                </p>
            </div>
        </main>
    )
}
