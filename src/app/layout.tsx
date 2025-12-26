import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'

const proximaNovaRegular = localFont({
    src: '../../public/fonts/proximanova_regular.ttf',
})

export const metadata: Metadata = {
    metadataBase: new URL('https://idolguessr.fun'),
    title: {
        default: 'IdolGuessr - K-pop Idol Guessing Game',
        template: `%s | IdolGuessr`,
    },
    description:
        'Guess The K-pop Idol - A fun web game where K-pop fans test their knowledge by guessing idols from pixelated photos.',
    keywords: [
        'kpop',
        'k-pop',
        'wordle',
        'kpop worlde',
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
                className={`${proximaNovaRegular.className} antialiased`}
            >
                {children}
                <Analytics />
            </body>
        </html>
    )
}
