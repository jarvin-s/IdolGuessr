import type { Metadata } from 'next'
import localFont from 'next/font/local'
import Script from 'next/script'
import './globals.css'
import { Analytics } from '@vercel/analytics/next'
import LiveAnnouncementBanner from '@/components/announcements/LiveAnnouncementBanner'
import { ColorblindProvider } from '@/components/theme/ColorblindProvider'
import { ThemeProvider } from '@/components/theme/ThemeProvider'
import { AuthProvider } from '@/components/auth/AuthProvider'
import { FeedbackNoticeProvider } from '@/components/feedback/FeedbackNoticeProvider'
import GuestSavePrompt from '@/components/auth/GuestSavePrompt'
import { themeInitScript } from '@/components/theme/theme'

const proximaNovaRegular = localFont({
    src: '../../public/fonts/proximanova_regular.ttf',
})

const PRODUCTION_SITE = 'https://idolguessr.fun'
const TEST_SITE = 'https://j390jefj890wef.vercel.app'

function siteOrigin() {
    const vercelUrl = process.env.VERCEL_URL ?? ''
    if (vercelUrl.includes('j390jefj890wef')) return TEST_SITE
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
    const isTest = vercelEnv
        ? vercelEnv !== 'production'
        : process.env.NODE_ENV !== 'production'
    return isTest ? TEST_SITE : PRODUCTION_SITE
}

const shareImage = `${siteOrigin()}/images/og-image.png`

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
        'Guess your favourite K-pop idols through clues, pixelated images and much more!',
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
        'guess kpop idol',
        'guess idol kpop',
        'guess kpop',
        'kpop guess',
        'kpop guessing',
        'kpop idol guessing',
        'guessing kpop',
        'guessing the kpop idol',
        'kpop guess idol',
        'guessing app kpop',
        'kpop guessing app',
        'guessing kpop online',
        'guess kpop online',
        'guess kpop app',
        'kpop guess app',
        'guessing kpop idol app',
        'kpop guessing idol app',
        'idol kpop guessing app',
        'idol kpop guess app',
        'kpop idol guess app',
    ],
    twitter: {
        card: 'summary_large_image',
        title: 'IdolGuessr - K-pop Idol Guessing Game',
        description:
            'Guess your favorite K-pop idols through clues, pixelated images and much more!',
        images: [shareImage],
        site: 'IdolGuessr',
    },
    openGraph: {
        title: 'IdolGuessr - K-pop Idol Guessing Game',
        description:
            'Guess your favorite K-pop idols through clues, pixelated images and much more!',
        images: [
            {
                url: shareImage,
                width: 1200,
                height: 630,
                alt: 'Play now on IdolGuessr',
            },
        ],
        siteName: 'IdolGuessr',
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
                    <ColorblindProvider>
                        <AuthProvider>
                            <FeedbackNoticeProvider>
                                {children}
                                <GuestSavePrompt />
                                <LiveAnnouncementBanner />
                                <Analytics />
                            </FeedbackNoticeProvider>
                        </AuthProvider>
                    </ColorblindProvider>
                </ThemeProvider>
                <meta
                    name='google-site-verification'
                    content='MdKcxKgV8Gu3dX6zl6vvcc2j7s1XCV3d2ta--42CZbU'
                />
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
