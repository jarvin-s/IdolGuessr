'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import SignInButton from './SignInButton'
import { useAuth } from './AuthProvider'
import { getProfile, savePlayerSettings } from '@/lib/player'

const DISMISS_KEY = 'hide-guest-prompt'

function guestPromptDismissed() {
    try {
        if (localStorage.getItem(DISMISS_KEY) === '1') return true
    } catch {
        return false
    }
    return Boolean(getProfile()?.seen_notices?.guest_save)
}

function dismissGuestPrompt() {
    try {
        localStorage.setItem(DISMISS_KEY, '1')
    } catch {
        // The profile notice still records the dismissal.
    }
    void savePlayerSettings({ seen_notices: { guest_save: true } })
}

export default function GuestSavePrompt() {
    const { isGuest } = useAuth()
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const show = () => {
            if (isGuest && !guestPromptDismissed()) setOpen(true)
        }
        window.addEventListener('idol-guessr-guest-prompt', show)
        return () =>
            window.removeEventListener('idol-guessr-guest-prompt', show)
    }, [isGuest])

    if (!open || !isGuest || guestPromptDismissed()) return null

    return (
        <div className='fixed top-4 right-4 z-[280] w-[min(100%-2rem,22rem)] rounded-lg border border-gray-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
            <p className='text-sm text-gray-700 dark:text-zinc-300'>
                Sign in with Google to keep this streak and pick a nickname for
                the leaderboard.
            </p>
            <div className='mt-3 flex items-center gap-3'>
                <SignInButton />
                <Link
                    href='/profile'
                    className='text-sm text-gray-500 underline dark:text-zinc-400'
                >
                    Profile
                </Link>
                <button
                    type='button'
                    onClick={() => {
                        dismissGuestPrompt()
                        setOpen(false)
                    }}
                    className='ml-auto text-sm text-gray-500 dark:text-zinc-400'
                >
                    Not now
                </button>
            </div>
        </div>
    )
}
