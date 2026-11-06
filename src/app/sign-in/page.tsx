'use client'

import { FormEvent, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { saveNickname, signInWithEmail } from '@/lib/player'

function errorText(error: unknown, fallback: string) {
    if (error instanceof Error && error.message) {
        return error.message.replaceAll('_', ' ')
    }
    return fallback
}

const signInPortraits: {
    src: string
    className: string
    imageClassName?: string
}[] = [
    {
        src: '/images/sign-in/felix-001.webp',
        className: 'left-[4%] top-[8%] size-48',
    },
    {
        src: '/images/sign-in/jungkook-001.webp',
        className: 'left-[1%] top-[40%] size-56',
    },
    {
        src: '/images/sign-in/kai.webp',
        className: 'left-[15%] bottom-[18%] size-48',
    },
    {
        src: '/images/sign-in/sunghoon-001.webp',
        className: 'left-[20%] top-[1%] size-32',
    },
    {
        src: '/images/sign-in/chaewon-001.webp',
        className: 'left-[21%] top-[30%] size-36',
    },
    {
        src: '/images/sign-in/mingyu-001.webp',
        className: 'left-[1%] bottom-[5%] size-36',
    },
    {
        src: '/images/sign-in/wonyoung-001.webp',
        className: 'right-[2%] top-[5%] size-44',
    },
    {
        src: '/images/sign-in/karina.webp',
        className: 'right-[18%] top-[36%] size-48',
    },
    {
        src: '/images/sign-in/sullyoon-001.webp',
        className: 'right-[3%] bottom-[7%] size-52',
    },
    {
        src: '/images/sign-in/wonhee-001.webp',
        className: 'right-[20%] top-[5%] size-36',
        imageClassName: 'object-[center_30%]',
    },
    {
        src: '/images/sign-in/beomgyu-001.webp',
        className: 'right-[3%] top-[44%] size-36',
    },
    {
        src: '/images/sign-in/stella-001.webp',
        className: 'right-[23%] bottom-[4%] size-48',
        imageClassName: 'object-top',
    },
]

export default function SignInPage() {
    const router = useRouter()
    const { profile, isGuest, signInWithGoogle } = useAuth()
    const [email, setEmail] = useState('')
    const [sentEmail, setSentEmail] = useState('')
    const [nickname, setNickname] = useState('')
    const [error, setError] = useState('')
    const [pending, setPending] = useState<
        'google' | 'email' | 'nickname' | null
    >(null)

    useEffect(() => {
        if (!isGuest && profile?.nickname) router.replace('/profile')
    }, [isGuest, profile?.nickname, router])

    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        if (params.get('auth') === 'error') {
            setError('That sign-in link did not work. Try again.')
        }
    }, [])

    async function continueWithGoogle() {
        setPending('google')
        setError('')
        try {
            await signInWithGoogle()
        } catch (err: unknown) {
            setError(errorText(err, 'Could not open Google.'))
            setPending(null)
        }
    }

    async function continueWithEmail(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setPending('email')
        setError('')
        try {
            const result = await signInWithEmail(email)
            if (result === 'signed-in') return
            setSentEmail(email.trim())
        } catch (err: unknown) {
            setError(errorText(err, 'Could not send the email.'))
        } finally {
            setPending(null)
        }
    }

    async function saveUsername(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setPending('nickname')
        setError('')
        try {
            await saveNickname(nickname.trim())
            router.replace('/profile')
        } catch (err: unknown) {
            setError(errorText(err, 'Could not save that username.'))
            setPending(null)
        }
    }

    const needsUsername = !isGuest && !profile?.nickname

    return (
        <main className='relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-tr from-black to-pink-900 px-4 text-white'>
            <div className='pointer-events-none absolute inset-0 hidden lg:block' aria-hidden>
                {signInPortraits.map((portrait) => (
                    <div
                        key={portrait.src}
                        className={`absolute overflow-hidden rounded-full ${portrait.className}`}
                    >
                        <Image
                            src={portrait.src}
                            alt=''
                            width={320}
                            height={320}
                            className={`size-full object-cover ${portrait.imageClassName ?? ''}`}
                        />
                    </div>
                ))}
            </div>
            <div className='relative z-10 mx-auto flex w-full max-w-sm flex-1 flex-col items-center md:justify-center justify-start py-10'>
                <Link
                    href='/'
                    className='mb-8 flex h-8 cursor-pointer items-center justify-center gap-2 self-start rounded-full bg-zinc-800 px-3 transition-colors hover:bg-zinc-700'
                    aria-label='Back to the game'
                >
                    <svg
                        className='h-4 w-4 text-zinc-300'
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
                    <span className='text-sm text-zinc-300'>
                        Back to the game
                    </span>
                </Link>
                <Image
                    src='/images/idolguessr-logo.webp'
                    alt='IdolGuessr'
                    width={640}
                    height={280}
                    priority
                    className='h-auto w-56'
                />

                {needsUsername ? (
                    <form
                        onSubmit={(event) => void saveUsername(event)}
                        className='mt-8 w-full'
                    >
                        <h1 className='text-center text-2xl font-bold'>
                            Pick a username
                        </h1>
                        <p className='mt-2 text-center text-sm text-zinc-400'>
                            This is the name on the leaderboard.
                        </p>
                        <label
                            className='mt-8 block text-sm font-medium'
                            htmlFor='username'
                        >
                            Username
                        </label>
                        <input
                            id='username'
                            value={nickname}
                            onChange={(event) =>
                                setNickname(event.target.value)
                            }
                            maxLength={20}
                            autoComplete='username'
                            required
                            className='mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500'
                        />
                        <p className='mt-2 text-xs text-zinc-500'>
                            3–20 letters, numbers, or underscores. You can
                            change it once every 7 days.
                        </p>
                        {error ? (
                            <p className='mt-3 text-sm text-red-400'>{error}</p>
                        ) : null}
                        <button
                            type='submit'
                            disabled={pending === 'nickname'}
                            className='mt-4 w-full cursor-pointer rounded-full bg-pink-500 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-default disabled:opacity-60'
                        >
                            {pending === 'nickname'
                                ? 'Saving…'
                                : 'Save username'}
                        </button>
                    </form>
                ) : sentEmail ? (
                    <div className='mt-8 w-full text-center'>
                        <h1 className='text-2xl font-bold'>Check your email</h1>
                        <p className='mt-2 text-sm text-zinc-400'>
                            We sent a sign-in link to {sentEmail}.
                        </p>
                        <button
                            type='button'
                            onClick={() => {
                                setSentEmail('')
                                setError('')
                            }}
                            className='mt-6 cursor-pointer text-sm text-zinc-300 underline'
                        >
                            Use a different email
                        </button>
                    </div>
                ) : (
                    <>
                        <h1 className='mt-8 text-center text-2xl font-bold'>
                            Sign in or create an account
                        </h1>
                        <p className='mt-2 text-center text-sm text-zinc-400'>
                            Join the community and play every day.
                        </p>

                        <button
                            type='button'
                            onClick={() => void continueWithGoogle()}
                            disabled={pending !== null}
                            className='mt-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-950 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-900 disabled:cursor-default disabled:opacity-60'
                        >
                            <Image
                                src='/icons/google.svg'
                                alt='Google'
                                width={18}
                                height={18}
                                className='h-5 w-5'
                            />
                            {pending === 'google'
                                ? 'Opening Google…'
                                : 'Continue with Google'}
                        </button>

                        <div className='my-6 flex w-full items-center gap-3'>
                            <div className='h-px flex-1 bg-zinc-700' />
                            <span className='text-xs tracking-wide text-zinc-500'>
                                OR
                            </span>
                            <div className='h-px flex-1 bg-zinc-700' />
                        </div>

                        <form
                            onSubmit={(event) => void continueWithEmail(event)}
                            className='w-full'
                        >
                            <label
                                className='block text-sm font-medium'
                                htmlFor='email'
                            >
                                Email
                            </label>
                            <input
                                id='email'
                                type='email'
                                inputMode='email'
                                autoComplete='email'
                                required
                                value={email}
                                onChange={(event) =>
                                    setEmail(event.target.value)
                                }
                                placeholder='Enter your email'
                                className='mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-white outline-none placeholder:text-zinc-500 focus:border-zinc-500'
                            />
                            {error ? (
                                <p className='mt-3 text-sm text-red-400'>
                                    {error}
                                </p>
                            ) : null}
                            <button
                                type='submit'
                                disabled={pending !== null}
                                className='mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-pink-500 py-3 text-sm font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-default disabled:opacity-60'
                            >
                                <Image
                                    src='/icons/mail.svg'
                                    alt='Email'
                                    width={18}
                                    height={18}
                                    className='h-5 w-5'
                                />
                                {pending === 'email'
                                    ? 'Sending…'
                                    : 'Continue with email'}
                            </button>
                        </form>

                        <p className='mt-6 text-center text-sm text-zinc-400'>
                            Your account keeps your streaks and your nickname on
                            the leaderboard.
                        </p>
                    </>
                )}
            </div>
        </main>
    )
}
