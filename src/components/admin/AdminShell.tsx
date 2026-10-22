'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import localFont from 'next/font/local'
import type { Session } from '@supabase/supabase-js'
import {
    checkIsAdmin,
    signInAdmin,
    signOutAdmin,
    supabase,
} from '@/lib/supabase'
import ThemeToggle from '@/components/theme/ThemeToggle'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

type AuthState = 'loading' | 'signed-out' | 'unauthorized' | 'admin'

export default function AdminShell({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [session, setSession] = useState<Session | null | undefined>(
        undefined
    )
    const [authState, setAuthState] = useState<AuthState>('loading')

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => setSession(data.session))
        const { data } = supabase.auth.onAuthStateChange(
            (_event, newSession) => {
                setSession(newSession)
            }
        )
        return () => data.subscription.unsubscribe()
    }, [])

    const userId =
        session === undefined ? undefined : (session?.user.id ?? null)

    useEffect(() => {
        if (userId === undefined) return
        if (!userId) {
            setAuthState('signed-out')
            return
        }
        setAuthState('loading')
        let cancelled = false
        checkIsAdmin()
            .then((isAdmin) => {
                if (!cancelled) setAuthState(isAdmin ? 'admin' : 'unauthorized')
            })
            .catch(() => {
                if (!cancelled) setAuthState('unauthorized')
            })
        return () => {
            cancelled = true
        }
    }, [userId])

    const title = pathname.startsWith('/admin/tickets')
        ? 'Feedback tickets'
        : pathname.startsWith('/admin/announcements')
          ? 'Announcements'
          : 'Admin'

    return (
        <main className='min-h-screen overflow-x-hidden bg-gray-50 p-3 sm:p-8 dark:bg-zinc-950'>
            <div className='mx-auto w-full max-w-6xl min-w-0'>
                <header className='mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-6'>
                    <div className='flex flex-wrap items-center gap-3'>
                        <h1
                            className={`${proximaNovaBold.className} text-xl uppercase sm:text-2xl`}
                        >
                            {title}
                        </h1>
                        {authState === 'admin' && (
                            <nav className='flex gap-2'>
                                <Link
                                    href='/admin/tickets'
                                    className={navClass(
                                        pathname.startsWith('/admin/tickets')
                                    )}
                                >
                                    Tickets
                                </Link>
                                <Link
                                    href='/admin/announcements'
                                    className={navClass(
                                        pathname.startsWith(
                                            '/admin/announcements'
                                        )
                                    )}
                                >
                                    Announcements
                                </Link>
                            </nav>
                        )}
                    </div>
                    <div className='flex flex-wrap items-center gap-3'>
                        <ThemeToggle />
                        {session && (
                            <div className='flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400'>
                                <span className='hidden sm:inline'>
                                    {session.user.email}
                                </span>
                                <button
                                    onClick={() => signOutAdmin()}
                                    className='cursor-pointer rounded-full bg-gray-200 px-3 py-1.5 transition-colors hover:bg-gray-300 dark:bg-zinc-800 dark:hover:bg-zinc-600'
                                >
                                    Sign out
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {authState === 'loading' && (
                    <p className='text-gray-500 dark:text-zinc-400'>
                        Loading...
                    </p>
                )}
                {authState === 'signed-out' && <LoginForm />}
                {authState === 'unauthorized' && (
                    <div className='rounded-lg bg-white p-6 text-center shadow-sm dark:bg-zinc-900'>
                        <p className='text-gray-700 dark:text-zinc-300'>
                            Not authorized. This account is not registered as an
                            admin.
                        </p>
                    </div>
                )}
                {authState === 'admin' && children}
            </div>
        </main>
    )
}

function navClass(active: boolean) {
    return active
        ? 'rounded-full bg-pink-500 px-3 py-1.5 text-sm text-white'
        : 'rounded-full bg-gray-200 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-600'
}

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)
        try {
            await signInAdmin(email.trim(), password)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Sign in failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form
            onSubmit={handleSubmit}
            className='mx-auto max-w-sm space-y-4 rounded-lg bg-white p-6 shadow-sm dark:bg-zinc-900'
        >
            <h2 className={`${proximaNovaBold.className} text-lg uppercase`}>
                Sign in
            </h2>
            <input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='Email'
                autoComplete='email'
                required
                className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-300'
            />
            <input
                type='password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='Password'
                autoComplete='current-password'
                required
                className='w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base focus:border-transparent focus:ring-2 focus:ring-black focus:outline-none dark:border-zinc-600 dark:bg-zinc-800 dark:focus:ring-zinc-300'
            />
            {error && <p className='text-sm text-red-600'>{error}</p>}
            <button
                type='submit'
                disabled={isSubmitting}
                className='w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-400'
            >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
        </form>
    )
}
