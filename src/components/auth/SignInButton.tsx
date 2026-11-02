'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function SignInButton({
    label = 'Sign in with Google',
    className = '',
}: {
    label?: string
    className?: string
}) {
    const { isGuest, signInWithGoogle } = useAuth()
    const [pending, setPending] = useState(false)
    if (!isGuest) return null

    return (
        <button
            type='button'
            disabled={pending}
            onClick={() => {
                setPending(true)
                void signInWithGoogle().finally(() => setPending(false))
            }}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-full bg-black px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-white dark:text-black ${className}`}
        >
            <img
                src='/icons/google.svg'
                alt=''
                width={16}
                height={16}
                className='h-4 w-4 shrink-0'
            />
            {pending ? 'Opening Google…' : label}
        </button>
    )
}
