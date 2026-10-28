import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import LiveAnnouncementBanner from '@/components/announcements/LiveAnnouncementBanner'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { themeInitScript } from '@/components/theme/theme'

const proximaNovaRegular = localFont({
    src: '../../public/fonts/proximanova_regular.ttf',
})

export const metadata: Metadata = {
    metadataBase: new URL('https://idolguessr.fun'),
    title: {
        default: 'IdolGuessr - K-pop Idol Guessing Game',
        template: `%s | IdolGuessr`,
    },
    robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
            index: true,
            follow: true,
            noimageindex: false,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    description:
        'Guess The K-pop Idol - A fun web game where K-pop fans test their knowledge by guessing idols from pixelated photos.',
    keywords: [
        'kpop',
        'k-pop',
        'wordle',
        'kpop wordle',
        'k-pop wordle',
        'idol guesser',
        'idol guessing game',
        'daily',
        'idol',
        'idols',
        'guesser',
        'guessr',
        'guess the kpop',
        'guess the idol',
        'guess the kpop idol',
        'kpop idol guesser',
        'kpop idol guessr',
        'guess kpop idol',
        'guess idol kpop',
        'guess idol',
        'guess kpop',
        'kpop guess idol',
    ],
    openGraph: {
        title: 'IdolGuessr - K-pop Idol Guessing Game',
        description:
            'Guess The K-pop Idol - A fun web game where K-pop fans test their knowledge by guessing idols from pixelated photos.',
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang='en' suppressHydrationWarning>
            <body
                suppressHydrationWarning
                className={`${proximaNovaRegular.className} bg-white text-black antialiased dark:bg-zinc-950 dark:text-zinc-100`}
            >
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
                <ThemeProvider>
                    {children}
                    <LiveAnnouncementBanner />
                    <Analytics />
                </ThemeProvider>
                <Script
                    src='https://www.googletagmanager.com/gtag/js?id=G-6V9ZCS0XZP'
                    strategy='afterInteractive'
                />
                <Script id='google-analytics' strategy='afterInteractive'>
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-6V9ZCS0XZP');
                    `}
                </Script>
            </body>
        </html>
    )
}
