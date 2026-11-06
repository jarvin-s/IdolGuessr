'use client'

import Link from 'next/link'
import localFont from 'next/font/local'
import SignInButton from '@/components/auth/SignInButton'
import { useAuth } from '@/components/auth/AuthProvider'
import Image from 'next/image'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

interface AccountModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function AccountModal({ isOpen, onClose }: AccountModalProps) {
    const { isGuest, signOut } = useAuth()
    if (!isOpen) return null

    return (
        <div className='bg-opacity-50 fixed inset-0 z-[300] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-zinc-900'>
                <div className='mb-4 flex items-center justify-between'>
                    <button
                        onClick={onClose}
                        className='flex h-8 cursor-pointer items-center justify-center gap-2 rounded-full bg-gray-100 px-3 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        aria-label='Back to the game'
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
                            Back to the game
                        </span>
                    </button>
                    <button
                        onClick={onClose}
                        className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                        aria-label='Close account'
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
                                d='M6 18L18 6M6 6l12 12'
                            />
                        </svg>
                    </button>
                </div>

                <h1 className={`${proximaNovaBold.className} text-2xl uppercase`}>
                    Account
                </h1>
                <p className='mt-2 text-gray-600 dark:text-zinc-400'>
                    Your profile, the leaderboard, and sign in.
                </p>

                <div className='mt-6 space-y-3'>
                    <Link
                        href='/leaderboard'
                        className='flex w-full cursor-pointer items-center gap-4 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                    >
                        <div className='text-left'>
                            <h3 className={`${proximaNovaBold.className} text-lg`}>Leaderboard</h3>
                            <p className='text-sm text-gray-500 dark:text-zinc-400'>Highest streaks</p>
                        </div>
                    </Link>
                    <div className='flex gap-2'>
                        <Link
                            href='/profile'
                            className='inline-flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-full border border-gray-200 px-4 py-2 font-medium transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                        >
                            <Image src='/icons/person.svg' alt='' className='h-4 w-4 dark:invert' width={16} height={16} />
                            Profile
                        </Link>
                        {!isGuest ? (
                            <button
                                type='button'
                                onClick={() => void signOut()}
                                className='inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-gray-200 px-4 py-2 font-medium transition-colors hover:bg-gray-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                            >
                                <Image src='/icons/logout.svg' alt='' className='h-4 w-4 dark:invert' width={16} height={16} />
                                Sign out
                            </button>
                        ) : null}
                    </div>
                    <SignInButton className='w-full' />
                </div>
            </div>
        </div>
    )
}
