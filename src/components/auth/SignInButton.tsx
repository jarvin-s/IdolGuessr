'use client'

import Link from 'next/link'
import { useAuth } from './AuthProvider'

export default function SignInButton({
    label = 'Sign in',
    className = '',
}: {
    label?: string
    className?: string
}) {
    const { isGuest } = useAuth()
    if (!isGuest) return null

    return (
        <Link
            href='/sign-in'
            className={`inline-flex cursor-pointer items-center justify-center rounded-full bg-black px-4 py-2 text-sm text-white dark:bg-white dark:text-black ${className}`}
        >
            {label}
        </Link>
    )
}
