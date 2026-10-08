import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import localFont from 'next/font/local'
import {
    DIFFICULTIES,
    DIFFICULTY_DESCRIPTIONS,
    DIFFICULTY_LABELS,
} from '@/utils/difficulty'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

export const metadata: Metadata = {
    title: 'FAQ',
    description:
        'Frequently asked questions about IdolGuessr, the daily K-pop idol guessing game.',
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

const difficultySummary = DIFFICULTIES.map(
    (d) => `${DIFFICULTY_LABELS[d]}: ${DIFFICULTY_DESCRIPTIONS[d]}`
).join('. ')

const sections: FaqSection[] = [
    {
        title: 'The game',
        items: [
            {
                question: 'What is IdolGuessr?',
                plainAnswer:
                    'IdolGuessr is a K-pop guessing game. You get a pixelated photo of an idol and have to guess who it is.',
                answer: (
                    <p>
                        IdolGuessr is a K-pop guessing game. You get a pixelated
                        photo of an idol and have to guess who it is.
                    </p>
                ),
            },
            {
                question: 'How do I play?',
                plainAnswer:
                    'Type an idol stage name and submit it. Every wrong guess makes the photo clearer. You have 6 tries to get it right.',
                answer: (
                    <p>
                        Type an idol stage name and submit it. Every wrong guess
                        makes the photo clearer. You have 6 tries to get it
                        right.
                    </p>
                ),
            },
            {
                question: 'When does the daily idol change?',
                plainAnswer:
                    'There is a new idol once a day. The countdown at the top of the Daily page shows how long until the next one.',
                answer: (
                    <p>
                        There is a new idol once a day. The countdown at the top
                        of the Daily page shows how long until the next one.
                    </p>
                ),
            },
            {
                question: 'Can I play idols from previous days?',
                plainAnswer:
                    'Yes. In Daily mode, open the Info menu and choose Past idols.',
                answer: (
                    <p>
                        Yes. In Daily mode, open the Info menu and choose{' '}
                        <strong>Past idols</strong>.
                    </p>
                ),
            },
            {
                question: 'Why does it say my guess is not in the list?',
                plainAnswer:
                    'Guesses must be a known idol stage name. If an idol is missing, let us know through Send feedback in the Info menu.',
                answer: (
                    <p>
                        Guesses must be a known idol stage name. If an idol is
                        missing, let us know through{' '}
                        <strong>Send feedback</strong> in the Info menu.
                    </p>
                ),
            },
        ],
    },
    {
        title: 'Game modes',
        items: [
            {
                question: 'What is Infinite mode?',
                plainAnswer:
                    'Infinite mode gives you one idol after another so you can build a streak. You can filter by boy groups, girl groups and generation.',
                answer: (
                    <p>
                        Infinite mode gives you one idol after another so you
                        can build a streak. You can filter by boy groups, girl
                        groups and generation.
                    </p>
                ),
            },
            {
                question: 'What are the difficulty levels?',
                plainAnswer: `${difficultySummary}. In Challenger you only see the first 3 photos, and the clear photo is shown after the round.`,
                answer: (
                    <>
                        <ul className='space-y-1'>
                            {DIFFICULTIES.map((d) => (
                                <li key={d}>
                                    <strong>{DIFFICULTY_LABELS[d]}:</strong>{' '}
                                    {DIFFICULTY_DESCRIPTIONS[d]}
                                </li>
                            ))}
                        </ul>
                        <p className='mt-2'>
                            In Challenger you only see the first 3 photos, and
                            the clear photo is shown after the round.
                        </p>
                    </>
                ),
            },
            {
                question: 'What do hints and skips do?',
                plainAnswer:
                    "A hint shows the idol's group name. A skip moves you to the next idol without breaking your streak.",
                answer: (
                    <p>
                        A hint shows the idol&apos;s group name. A skip moves
                        you to the next idol without breaking your streak.
                    </p>
                ),
            },
            {
                question: 'What is Hangul mode?',
                plainAnswer:
                    "You see an idol's name written in Korean (Hangul) and type their English name. A hint reveals their group.",
                answer: (
                    <p>
                        You see an idol&apos;s name written in Korean (Hangul)
                        and type their English name. A hint reveals their group.
                    </p>
                ),
            },
            {
                question: 'How do Challenge links work?',
                plainAnswer:
                    'Create a challenge with 5, 10, 15 or 20 idols, share the link with friends, and compare your results.',
                answer: (
                    <p>
                        <Link href='/challenge' className='underline'>
                            Create a challenge
                        </Link>{' '}
                        with 5, 10, 15 or 20 idols, share the link with friends,
                        and compare your results.
                    </p>
                ),
            },
        ],
    },
    {
        title: 'Statistics',
        items: [
            {
                question: 'Where are my statistics saved?',
                plainAnswer:
                    'In your browser. There are no accounts, so clearing your browser data or switching devices starts your stats from zero.',
                answer: (
                    <p>
                        In your browser. There are no accounts, so clearing your
                        browser data or switching devices starts your stats from
                        zero.
                    </p>
                ),
            },
            {
                question: 'Does each difficulty have its own stats?',
                plainAnswer:
                    'Yes. Infinite mode keeps a separate streak and stats for Easy, Normal, Hard and Challenger.',
                answer: (
                    <p>
                        Yes. Infinite mode keeps a separate streak and stats for
                        Easy, Normal, Hard and Challenger.
                    </p>
                ),
            },
        ],
    },
    {
        title: 'Help',
        items: [
            {
                question: 'I found a bug or have an idea. How do I tell you?',
                plainAnswer:
                    'Open the Info menu and choose Send feedback. You will see our replies to your ticket there too.',
                answer: (
                    <p>
                        Open the Info menu and choose{' '}
                        <strong>Send feedback</strong>. You&apos;ll see our
                        replies to your ticket there too.
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

export default function FaqPage() {
    return (
        <main className='min-h-screen bg-white'>
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
            />
            <div className='mx-auto w-full max-w-md px-6 py-8'>
                <div className='mb-6 flex items-center justify-between'>
                    <Link
                        href='/'
                        className='flex h-8 items-center justify-center gap-2 rounded-full bg-gray-100 px-3 transition-colors hover:bg-gray-200'
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
                                d='M10 19l-7-7m0 0l7-7m-7 7h18'
                            />
                        </svg>
                        <span className='text-sm text-gray-600'>
                            Back to game
                        </span>
                    </Link>
                    <Image
                        src='/images/idolguessr-logo.png'
                        alt='IdolGuessr Logo'
                        width={150}
                        height={50}
                        className='h-10 w-auto'
                    />
                </div>

                <h1
                    className={`${proximaNovaBold.className} text-4xl uppercase`}
                >
                    FAQ
                </h1>
                <p className='mt-2 text-gray-600'>
                    Answers to the questions we get the most.
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
                                        className='group rounded-lg border border-gray-200 transition-colors open:bg-gray-50'
                                    >
                                        <summary className='flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-bold [&::-webkit-details-marker]:hidden'>
                                            {item.question}
                                            <svg
                                                className='h-5 w-5 flex-shrink-0 text-gray-400 transition-transform group-open:rotate-180'
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
                                        <div className='px-4 pb-4 text-gray-600'>
                                            {item.answer}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </main>
    )
}
