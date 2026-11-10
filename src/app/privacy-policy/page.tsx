import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import localFont from 'next/font/local'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Privacy policy for IdolGuessr.',
}

const heading = `${proximaNovaBold.className} text-xl uppercase text-black dark:text-white`
const subheading = `${proximaNovaBold.className} text-lg text-black dark:text-white`

const categories: {
    name: string
    collected: 'YES' | 'NO'
    examples: string
}[] = [
    {
        name: 'A. Identifiers',
        collected: 'YES',
        examples:
            'Account id, email address, nickname, and IP address in hosting and analytics logs.',
    },
    {
        name: 'B. Personal information as defined in the California Customer Records statute',
        collected: 'YES',
        examples:
            'Name and email address when you sign in with Google. We do not collect a postal address, phone number, education, employment history, or financial information.',
    },
    {
        name: 'C. Protected classification characteristics',
        collected: 'NO',
        examples:
            'We do not ask for gender, age, date of birth, race, ethnicity, or similar demographic data.',
    },
    {
        name: 'D. Commercial information',
        collected: 'NO',
        examples: 'We do not take payments or store purchase history.',
    },
    {
        name: 'E. Biometric information',
        collected: 'NO',
        examples: 'We do not collect fingerprints, face scans, or voiceprints.',
    },
    {
        name: 'F. Internet or other similar network activity',
        collected: 'YES',
        examples:
            'Pages measured by analytics, guesses, game results, browser, device type, and user agent.',
    },
    {
        name: 'G. Geolocation data',
        collected: 'NO',
        examples:
            'We do not collect GPS or precise device location. An IP address in a log can only suggest a rough region.',
    },
    {
        name: 'H. Audio, electronic, visual, or similar information',
        collected: 'NO',
        examples: 'We do not collect photos, audio, or video that you record.',
    },
    {
        name: 'I. Professional or employment-related information',
        collected: 'NO',
        examples: 'We do not collect job titles or work history.',
    },
    {
        name: 'J. Education information',
        collected: 'NO',
        examples: 'We do not collect student records.',
    },
    {
        name: 'K. Inferences drawn to profile you',
        collected: 'NO',
        examples:
            'We store the game results you produce. We do not build advertising or demographic profiles.',
    },
    {
        name: 'L. Sensitive personal information',
        collected: 'NO',
        examples:
            'We do not collect government identifiers, financial account details, precise location, or the contents of private messages outside the feedback you send us.',
    },
]

function Section({
    id,
    title,
    children,
}: {
    id?: string
    title?: string
    children: ReactNode
}) {
    return (
        <section id={id} className='space-y-3'>
            {title ? <h2 className={heading}>{title}</h2> : null}
            {children}
        </section>
    )
}

function ExternalLink({
    href,
    children,
}: {
    href: string
    children: ReactNode
}) {
    return (
        <a
            href={href}
            className='underline'
            target='_blank'
            rel='noopener noreferrer'
        >
            {children}
        </a>
    )
}

export default function PrivacyPolicyPage() {
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
                        src='/images/idolguessr-logo.webp'
                        alt='IdolGuessr Logo'
                        width={150}
                        height={50}
                        className='h-10 w-auto dark:invert'
                    />
                </div>

                <h1
                    className={`${proximaNovaBold.className} text-4xl uppercase`}
                >
                    Privacy Policy
                </h1>
                <p className='mt-2 text-gray-600 dark:text-zinc-400'>
                    Last updated November 04, 2026
                </p>

                <div className='mt-8 space-y-8 text-gray-600 dark:text-zinc-400'>
                    <Section>
                        <p>
                            This notice explains how IdolGuessr (&quot;we&quot;,
                            &quot;us&quot;, or &quot;our&quot;) handles personal
                            information when you use{' '}
                            <ExternalLink href='https://idolguessr.fun/'>
                                https://idolguessr.fun
                            </ExternalLink>{' '}
                            (the &quot;Services&quot;). IdolGuessr is a web game
                            where you guess K-pop idols from photos.
                        </p>
                        <p>
                            <strong>Questions or concerns? </strong>
                            Email us at{' '}
                            <ExternalLink href='mailto:idolguessr@gmail.com'>
                                idolguessr@gmail.com
                            </ExternalLink>
                            .
                        </p>
                    </Section>

                    <Section id='summary' title='Summary of key points'>
                        <p>
                            <strong>
                                What personal information do we process?{' '}
                            </strong>
                            An account id, your game progress, a nickname if you
                            set one, feedback you send, and technical data such
                            as your browser and IP address. If you sign in with
                            Google, we also receive your email address, name,
                            and profile picture from Google.
                        </p>
                        <p>
                            <strong>
                                Do we process sensitive personal
                                information?{' '}
                            </strong>
                            No. We do not ask for information such as your
                            health, biometrics, finances, race, or precise
                            location.
                        </p>
                        <p>
                            <strong>
                                Do we collect information from third
                                parties?{' '}
                            </strong>
                            Only if you sign in with Google. Google then
                            provides the account details described above.
                        </p>
                        <p>
                            <strong>How do we use it? </strong>
                            To run the game, save progress, show nicknames and
                            scores, reply to feedback, keep the site secure, and
                            measure how it is used.
                        </p>
                        <p>
                            <strong>Who do we share it with? </strong>
                            Supabase stores the database and accounts. Vercel
                            hosts the site and provides Vercel Analytics. Google
                            handles sign-in and Google Analytics. Other players
                            can see a nickname and score on the leaderboard and
                            in a challenge.
                        </p>
                        <p>
                            <strong>Do we sell it or use it for ads? </strong>
                            No. We do not sell personal information, and the
                            game does not show ads.
                        </p>
                        <p>
                            <strong>How do you exercise your rights? </strong>
                            Email{' '}
                            <ExternalLink href='mailto:idolguessr@gmail.com'>
                                idolguessr@gmail.com
                            </ExternalLink>
                            . You can change your nickname on your profile.
                        </p>
                    </Section>

                    <Section id='toc' title='Table of contents'>
                        <ul className='list-disc space-y-2 pl-5'>
                            <li>
                                <a className='underline' href='#infocollect'>
                                    1. What information do we collect?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#infouse'>
                                    2. How do we use your information?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#legalbases'>
                                    3. What legal bases do we rely on?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#whoshare'>
                                    4. When and with whom do we share personal
                                    information?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#3pwebsites'>
                                    5. What is our stance on third-party
                                    websites?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#cookies'>
                                    6. Do we use cookies and other tracking
                                    technologies?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#sociallogins'>
                                    7. How do we handle Google sign-in?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#inforetain'>
                                    8. How long do we keep your information?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#infosafe'>
                                    9. How do we keep your information safe?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#infominors'>
                                    10. Do we collect information from children?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#privacyrights'>
                                    11. What are your privacy rights?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#DNT'>
                                    12. Controls for Do-Not-Track features
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#uslaws'>
                                    13. Do United States residents have specific
                                    privacy rights?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#policyupdates'>
                                    14. Do we make updates to this notice?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#contact'>
                                    15. How can you contact us about this
                                    notice?
                                </a>
                            </li>
                            <li>
                                <a className='underline' href='#request'>
                                    16. How can you review, update, or delete
                                    your information?
                                </a>
                            </li>
                        </ul>
                    </Section>

                    <Section
                        id='infocollect'
                        title='1. What information do we collect?'
                    >
                        <h3 id='personalinfo' className={subheading}>
                            Information you provide
                        </h3>
                        <p>
                            <strong>
                                <em>In short: </em>
                            </strong>
                            Opening the game creates an anonymous account.
                            Signing in with Google, choosing a nickname, and
                            sending feedback add the details below.
                        </p>
                        <ul className='list-disc space-y-2 pl-5'>
                            <li>
                                An account id, created automatically so progress
                                can be saved. A guest account has no email
                                address and no password.
                            </li>
                            <li>
                                A nickname you choose. It is shown with your
                                scores.
                            </li>
                            <li>
                                Feedback messages you send, stored with your
                                account.
                            </li>
                            <li>
                                A display name submitted with a challenge
                                result, which is your nickname when you are
                                signed in.
                            </li>
                        </ul>
                        <p>
                            <strong>Sensitive information. </strong>
                            We do not process sensitive information.
                        </p>

                        <h3 className={subheading}>Information from Google</h3>
                        <p>
                            If you sign in with Google, Google gives us your
                            email address, name, and profile picture. We store
                            the picture address on your profile. We do not
                            receive your Google contacts or friends.
                        </p>

                        <h3 className={subheading}>
                            Information collected while you play
                        </h3>
                        <p>
                            We store guesses, whether a guess was right,
                            streaks, daily results, unlimited and hangul
                            progress, active games, challenge progress and
                            results, and settings such as difficulty, theme, and
                            filters.
                        </p>
                        <p>
                            When a guess is saved we also store the browser, a
                            general device type, and the user agent string.
                        </p>

                        <h3 className={subheading}>
                            Information collected automatically
                        </h3>
                        <p>
                            <strong>
                                <em>In short: </em>
                            </strong>
                            Hosting and analytics receive technical data about
                            the visit.
                        </p>
                        <ul className='list-disc space-y-2 pl-5'>
                            <li>
                                <em>Log and usage data. </em>
                                Vercel, which hosts the site, and the analytics
                                tools below can receive your IP address, browser
                                type, pages viewed, referring address, and the
                                time of the visit.
                            </li>
                            <li>
                                <em>Device data. </em>
                                Browser and device type, as described above. We
                                do not collect hardware identifiers, your mobile
                                carrier, or crash dumps.
                            </li>
                            <li>
                                <em>Location. </em>
                                We do not use GPS and we do not ask for a device
                                location permission. An IP address can indicate
                                a rough region. Turning off location services on
                                your phone does not change the game.
                            </li>
                        </ul>
                    </Section>

                    <Section
                        id='infouse'
                        title='2. How do we use your information?'
                    >
                        <p>
                            <strong>
                                <em>In short: </em>
                            </strong>
                            We use it to run IdolGuessr, not to advertise to
                            you.
                        </p>
                        <ul className='list-disc space-y-2 pl-5'>
                            <li>
                                <strong>Accounts. </strong>To create a guest
                                account, sign you in with Google, and link guest
                                progress to that Google account.
                            </li>
                            <li>
                                <strong>The game. </strong>To save progress,
                                scores, streaks, and settings, and to show the
                                game you asked to play.
                            </li>
                            <li>
                                <strong>Public results. </strong>To show your
                                nickname and streak on the leaderboard, and your
                                nickname and results to people who open the same
                                challenge.
                            </li>
                            <li>
                                <strong>Feedback. </strong>To read and reply to
                                messages you send us.
                            </li>
                            <li>
                                <strong>Security. </strong>To protect accounts
                                and look into abuse.
                            </li>
                            <li>
                                <strong>Usage. </strong>To understand which
                                pages and modes are used, through Google
                                Analytics and Vercel Analytics.
                            </li>
                        </ul>
                        <p>
                            We do not use your information for targeted
                            advertising, and we do not send marketing email.
                        </p>
                    </Section>

                    <Section
                        id='legalbases'
                        title='3. What legal bases do we rely on?'
                    >
                        <p>
                            <strong>
                                <em>In short: </em>
                            </strong>
                            We process information to provide the game, because
                            you sign in with Google, for our legitimate interest
                            in running and protecting the site, or because the
                            law requires it.
                        </p>
                        <h3 className={subheading}>
                            European Economic Area and United Kingdom
                        </h3>
                        <ul className='list-disc space-y-2 pl-5'>
                            <li>
                                <strong>Contract. </strong>Providing the game
                                and saving the progress you ask us to keep.
                            </li>
                            <li>
                                <strong>Legitimate interests. </strong>Securing
                                the service, answering feedback, and measuring
                                how the game is used so we can maintain it. We
                                do not use this basis to advertise.
                            </li>
                            <li>
                                <strong>Consent. </strong>Google sign-in. You
                                can sign out, and you can email us to withdraw
                                consent where we rely on it. See{' '}
                                <a
                                    className='underline'
                                    href='#withdrawconsent'
                                >
                                    withdrawing your consent
                                </a>
                                .
                            </li>
                            <li>
                                <strong>Legal obligation. </strong>Keeping or
                                disclosing information when the law requires it.
                            </li>
                        </ul>
                        <h3 className={subheading}>Canada</h3>
                        <p>
                            We process information with your consent, including
                            consent implied by playing, and where Canadian law
                            allows processing without consent for security or a
                            legal duty. You can withdraw consent by emailing{' '}
                            <ExternalLink href='mailto:idolguessr@gmail.com'>
                                idolguessr@gmail.com
                            </ExternalLink>
                            .
                        </p>
                    </Section>

                    <Section
                        id='whoshare'
                        title='4. When and with whom do we share personal information?'
                    >
                        <p>
                            <strong>
                                <em>In short: </em>
                            </strong>
                            We share it with the companies that host and measure
                            the game, and we show nicknames and scores to other
                            players.
                        </p>
                        <ul className='list-disc space-y-2 pl-5'>
                            <li>
                                <strong>Supabase. </strong>Stores accounts,
                                profiles, game progress, guesses, and feedback.
                            </li>
                            <li>
                                <strong>Vercel. </strong>Hosts the website,
                                keeps server logs, and provides Vercel
                                Analytics.
                            </li>
                            <li>
                                <strong>Google. </strong>Provides Google sign-in
                                and Google Analytics.
                            </li>
                            <li>
                                <strong>Other players. </strong>If you are
                                signed in and have a nickname, the leaderboard
                                shows that nickname and your best streak. People
                                with a challenge link can see the nickname and
                                results submitted for that challenge.
                            </li>
                            <li>
                                <strong>Legal and safety. </strong>We may
                                disclose information if the law requires it, or
                                to investigate abuse of the game.
                            </li>
                            <li>
                                <strong>Business transfers. </strong>We may
                                transfer information if IdolGuessr is sold,
                                merged, or reorganized.
                            </li>
                        </ul>
                        <p>We do not sell personal information.</p>
                    </Section>

                    <Section
                        id='3pwebsites'
                        title='5. What is our stance on third-party websites?'
                    >
                        <p>
                            The site links to other websites, including
                            Google&apos;s. We do not control those sites, and
                            this notice does not cover them. The game does not
                            show third-party advertisements.
                        </p>
                    </Section>

                    <Section
                        id='cookies'
                        title='6. Do we use cookies and other tracking technologies?'
                    >
                        <p>
                            <strong>
                                <em>In short: </em>
                            </strong>
                            We use cookies and browser storage to keep you
                            signed in, remember the theme, and measure visits.
                            We do not use them for advertising.
                        </p>
                        <ul className='list-disc space-y-2 pl-5'>
                            <li>
                                <strong>Theme. </strong>A cookie named
                                idol-guessr-theme, kept for about a year, so
                                light or dark mode can load before the page
                                appears.
                            </li>

                            <li>
                                <strong>Sign-in. </strong>Supabase
                                authentication cookies that keep your session.
                            </li>
                            <li>
                                <strong>Google Analytics. </strong>Cookies from
                                Google Analytics 4.
                            </li>
                            <li>
                                <strong>Vercel Analytics. </strong>Page-view
                                measurement from our host.
                            </li>
                            <li>
                                <strong>Browser storage. </strong>Preferences on
                                your device, such as idols you have already
                                seen.
                            </li>
                        </ul>
                        <p>
                            You can block or delete cookies in your browser.
                            Blocking them can sign you out or reset the theme.
                            To opt out of Google Analytics in the browser, you
                            can use{' '}
                            <ExternalLink href='https://tools.google.com/dlpage/gaoptout'>
                                Google&apos;s opt-out add-on
                            </ExternalLink>
                            . Google describes its own practices in the{' '}
                            <ExternalLink href='https://policies.google.com/privacy'>
                                Google Privacy Policy
                            </ExternalLink>
                            .
                        </p>
                    </Section>

                    <Section
                        id='sociallogins'
                        title='7. How do we handle Google sign-in?'
                    >
                        <p>
                            <strong>
                                <em>In short: </em>
                            </strong>
                            Google is the only social login. We use it to
                            identify your account.
                        </p>
                        <p>
                            If you choose Google, we receive your email address,
                            name, and profile picture. We use them to create or
                            link your account and to show your picture on your
                            profile. We do not receive a friends list, and we do
                            not offer Facebook or X login.
                        </p>
                        <p>
                            Our use of information received from Google APIs
                            follows the{' '}
                            <ExternalLink href='https://developers.google.com/terms/api-services-user-data-policy'>
                                Google API Services User Data Policy
                            </ExternalLink>
                            , including the{' '}
                            <ExternalLink href='https://developers.google.com/terms/api-services-user-data-policy#limited-use'>
                                Limited Use requirements
                            </ExternalLink>
                            . Google&apos;s own use of your account is covered
                            by Google&apos;s privacy policy, not this one.
                        </p>
                    </Section>

                    <Section
                        id='inforetain'
                        title='8. How long do we keep your information?'
                    >
                        <p>
                            <strong>
                                <em>In short: </em>
                            </strong>
                            We keep account and game data while the account
                            exists.
                        </p>
                        <p>
                            Guest play uses an account too. Email{' '}
                            <ExternalLink href='mailto:idolguessr@gmail.com'>
                                idolguessr@gmail.com
                            </ExternalLink>{' '}
                            if you want it deleted. We then delete it from the
                            active database. We may keep a specific record
                            longer when we need it for security, abuse
                            prevention, or a legal duty. Copies in backups
                            remain until those backups expire.
                        </p>
                    </Section>

                    <Section
                        id='infosafe'
                        title='9. How do we keep your information safe?'
                    >
                        <p>
                            Account data is stored in Supabase with access rules
                            that limit players to their own records, except for
                            information this notice says is public, such as a
                            leaderboard nickname. No transmission or storage on
                            the internet is completely secure.
                        </p>
                    </Section>

                    <Section
                        id='infominors'
                        title='10. Do we collect information from children?'
                    >
                        <p>
                            <strong>
                                <em>In short: </em>
                            </strong>
                            The game does not ask your age, and it is not
                            directed at children under 13.
                        </p>
                        <p>
                            We do not knowingly collect personal information
                            from children under 13. If you believe we have,
                            email{' '}
                            <ExternalLink href='mailto:idolguessr@gmail.com'>
                                idolguessr@gmail.com
                            </ExternalLink>{' '}
                            and we will delete that account.
                        </p>
                    </Section>

                    <Section
                        id='privacyrights'
                        title='11. What are your privacy rights?'
                    >
                        <p>
                            Depending on where you live, including the European
                            Economic Area, the United Kingdom, Switzerland,
                            Canada, and some US states, you may have the right
                            to access, correct, or delete your personal
                            information, restrict or object to certain
                            processing, and receive a copy. We do not make
                            decisions about you that produce legal effects
                            solely by automated means.
                        </p>
                        <p>
                            Email{' '}
                            <ExternalLink href='mailto:idolguessr@gmail.com'>
                                idolguessr@gmail.com
                            </ExternalLink>{' '}
                            to use these rights. You can change your nickname on
                            your profile page. There is no separate contact
                            form.
                        </p>
                        <p>
                            If you are in the EEA or the UK, you can also
                            complain to your{' '}
                            <ExternalLink href='https://www.edpb.europa.eu/about-edpb/about-edpb/members_en'>
                                data protection authority
                            </ExternalLink>{' '}
                            or the{' '}
                            <ExternalLink href='https://ico.org.uk/make-a-complaint/'>
                                UK Information Commissioner&apos;s Office
                            </ExternalLink>
                            . If you are in Switzerland, you can contact the{' '}
                            <ExternalLink href='https://www.edoeb.admin.ch/en'>
                                Federal Data Protection and Information
                                Commissioner
                            </ExternalLink>
                            .
                        </p>
                        <p id='withdrawconsent'>
                            <strong>Withdrawing your consent. </strong>
                            Where we rely on consent, you can withdraw it by
                            emailing us. That does not affect processing that
                            already happened, or processing we do on another
                            lawful basis, such as providing the game.
                        </p>
                        <h3 className={subheading}>Account information</h3>
                        <p>
                            You can update your nickname while signed in. To
                            delete the account, email us. We will delete it from
                            the active database. We may retain a specific record
                            for security, abuse prevention, or a legal duty, as
                            described above.
                        </p>
                    </Section>

                    <Section
                        id='DNT'
                        title='12. Controls for Do-Not-Track features'
                    >
                        <p>
                            The game does not respond to the Do Not Track
                            browser signal, or to other automatic signals that
                            ask sites not to track you. Google Analytics and
                            Vercel Analytics still load. There is no common
                            standard that we apply for these signals.
                        </p>
                    </Section>

                    <Section
                        id='uslaws'
                        title='13. Do United States residents have specific privacy rights?'
                    >
                        <p>
                            Residents of states with consumer privacy laws,
                            including California, Colorado, Connecticut,
                            Delaware, Florida, Indiana, Iowa, Kentucky,
                            Maryland, Minnesota, Montana, Nebraska, New
                            Hampshire, New Jersey, Oregon, Rhode Island,
                            Tennessee, Texas, Utah, and Virginia, may have the
                            right to access, correct, delete, and obtain a copy
                            of personal information, and to appeal a refusal.
                            Email{' '}
                            <ExternalLink href='mailto:idolguessr@gmail.com'>
                                idolguessr@gmail.com
                            </ExternalLink>{' '}
                            to make a request or an appeal. We may need to
                            confirm that the request comes from you.
                        </p>
                        <h3 className={subheading}>
                            Categories collected in the past 12 months
                        </h3>
                        <p>
                            The list uses the California category names.
                            &quot;YES&quot; means we collected something in that
                            category. It does not mean we collected every
                            example the law lists for that category.
                        </p>
                        <ul className='space-y-3'>
                            {categories.map((category) => (
                                <li key={category.name}>
                                    <p className='font-bold text-black dark:text-white'>
                                        {category.name}{' '}
                                        <span className='text-pink-400'>
                                            {category.collected}
                                        </span>
                                    </p>
                                    <p>{category.examples}</p>
                                </li>
                            ))}
                        </ul>
                        <p>
                            We have not sold personal information, and we do not
                            share it for cross-context behavioral advertising.
                            Service providers and the public nickname and score
                            displays described above are not a sale.
                        </p>
                        <p>
                            We do not disclose personal information to third
                            parties for their own direct marketing.
                            California&apos;s Shine the Light law therefore has
                            no categories or third parties for us to list.
                        </p>
                    </Section>

                    <Section
                        id='policyupdates'
                        title='14. Do we make updates to this notice?'
                    >
                        <p>
                            We update this page when our practices change. The
                            date at the top is the latest revision. If a change
                            is material, we will post the updated notice here.
                        </p>
                    </Section>

                    <Section
                        id='contact'
                        title='15. How can you contact us about this notice?'
                    >
                        <p>
                            Email{' '}
                            <ExternalLink href='mailto:idolguessr@gmail.com'>
                                idolguessr@gmail.com
                            </ExternalLink>
                            .
                        </p>
                        <p>IdolGuessr</p>
                        <p>Netherlands</p>
                    </Section>

                    <Section
                        id='request'
                        title='16. How can you review, update, or delete your information?'
                    >
                        <p>
                            Change your nickname on your profile. For access,
                            correction, or deletion of the rest, email{' '}
                            <ExternalLink href='mailto:idolguessr@gmail.com'>
                                idolguessr@gmail.com
                            </ExternalLink>
                            .
                        </p>
                    </Section>
                </div>
            </div>
        </main>
    )
}
