import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import localFont from 'next/font/local'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

export const metadata: Metadata = {
    title: 'Terms and Conditions',
    description: 'Terms and conditions for IdolGuessr.',
}

const heading = `${proximaNovaBold.className} text-xl uppercase text-black dark:text-white`

function Section({ id, title, children }: { id?: string; title?: string; children: ReactNode }) {
    return (
        <section id={id} className='space-y-3'>
            {title ? <h2 className={heading}>{title}</h2> : null}
            {children}
        </section>
    )
}

export default function TermsAndConditionsPage() {
    return (
        <main className='min-h-screen bg-white dark:bg-zinc-950'>
            <div className='mx-auto w-full max-w-2xl px-6 py-8'>
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

                <h1 className={`${proximaNovaBold.className} text-4xl uppercase`}>
                    Terms and Conditions
                </h1>
                <p className='mt-2 text-gray-600 dark:text-zinc-400'>
                    Last updated November 04, 2026
                </p>

                <div className='mt-8 space-y-8 text-gray-600 dark:text-zinc-400'>
                    <Section>
                        <p>
                            These terms apply when you use IdolGuessr at{' '}
                            <a
                                href='https://idolguessr.fun/'
                                className='underline'
                                target='_blank'
                                rel='noopener noreferrer'
                            >
                                https://idolguessr.fun
                            </a>
                            . By playing, you agree to them. If you do not agree, do not use the
                            game.
                        </p>
                    </Section>

                    <Section id='game' title='1. The game'>
                        <p>
                            IdolGuessr is a free web game where you guess K-pop idols from photos.
                            Modes include a daily puzzle, unlimited play, hangul, and challenge
                            links. The game is for personal entertainment. There is no purchase,
                            prize, or paid feature.
                        </p>
                        <p>
                            We can change modes, puzzles, scoring, and the idol list, and we can
                            pause or stop the game.
                        </p>
                    </Section>

                    <Section id='accounts' title='2. Accounts'>
                        <p>
                            Opening the game creates a guest account so progress can be saved. You
                            can sign in with Google to keep that progress and choose a nickname.
                            You can sign out and return to a guest account.
                        </p>
                        <p>
                            You are responsible for the Google account you use. Do not sign in with
                            an account you are not allowed to use.
                        </p>
                    </Section>

                    <Section id='nicknames' title='3. Nicknames and public scores'>
                        <p>
                            A nickname is 3 to 20 characters and can use letters, numbers, and
                            underscores. Signed-in players with a nickname can appear on the
                            leaderboard with their best streak. A challenge result shows the
                            nickname and score to anyone with that challenge link.
                        </p>
                        <p>
                            Do not use a nickname that impersonates someone else, or that is
                            hateful, sexual, or otherwise abusive. We may remove a nickname or
                            account that breaks this rule.
                        </p>
                    </Section>

                    <Section id='use' title='4. Acceptable use'>
                        <p>You agree not to:</p>
                        <ul className='list-disc space-y-2 pl-5'>
                            <li>Break the game, probe it for weaknesses, or try to access another player&apos;s account.</li>
                            <li>Scrape the site or overload it with automated requests.</li>
                            <li>Send feedback that is unlawful, hateful, or abusive.</li>
                            <li>Use the game to distribute malware or to mislead other players.</li>
                        </ul>
                    </Section>

                    <Section id='content' title='5. Idol names and photos'>
                        <p>
                            Idol names, group names, and photos belong to their owners. IdolGuessr
                            does not claim ownership of them. They are shown so you can play the
                            guessing game.
                        </p>
                        <p>
                            If you are a rights holder and want a photo or name removed, email{' '}
                            <a href='mailto:idolguessr@gmail.com' className='underline'>
                                idolguessr@gmail.com
                            </a>
                            . Tell us what to remove and where you found it.
                        </p>
                    </Section>

                    <Section id='feedback' title='6. Feedback'>
                        <p>
                            If you send feedback, we can read it, reply, and use the idea to change
                            the game. You keep ownership of the words you write. Do not send
                            information you are not allowed to share.
                        </p>
                    </Section>

                    <Section id='disclaimer' title='7. Disclaimer'>
                        <p>
                            The game is provided as is. We do not promise that it will always be
                            available, accurate, or free of mistakes. Puzzle answers, streaks, and
                            leaderboard ranks can be lost or corrected when we fix a bug or change
                            the game.
                        </p>
                        <p>
                            To the extent the law allows, we are not liable for loss of progress,
                            data, or anything else that results from using or being unable to use
                            IdolGuessr.
                        </p>
                    </Section>

                    <Section id='privacy' title='8. Privacy'>
                        <p>
                            Our{' '}
                            <Link href='/privacy-policy' className='underline'>
                                privacy policy
                            </Link>{' '}
                            explains what we collect and how we use it. The game does not ask your
                            age and is not directed at children under 13.
                        </p>
                    </Section>

                    <Section id='changes' title='9. Changes to these terms'>
                        <p>
                            We can update these terms. The date at the top is the latest revision.
                            Continuing to play after an update means you accept the revised terms.
                        </p>
                    </Section>

                    <Section id='contact' title='10. Contact'>
                        <p>
                            Email{' '}
                            <a href='mailto:idolguessr@gmail.com' className='underline'>
                                idolguessr@gmail.com
                            </a>
                            .
                        </p>
                        <p>IdolGuessr</p>
                        <p>Netherlands</p>
                    </Section>
                </div>
            </div>
        </main>
    )
}
