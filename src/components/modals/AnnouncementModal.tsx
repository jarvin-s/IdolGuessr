'use client'

import { useEffect, useState } from 'react'
import localFont from 'next/font/local'

const proximaNovaBold = localFont({
    src: '../../../public/fonts/proximanova_bold.otf',
})

const STORAGE_KEY = 'testing-environment-seen'

export default function AnnouncementModal() {
    const [isOpen, setIsOpen] = useState(false)

    useEffect(() => {
        try {
            const seen = localStorage.getItem(STORAGE_KEY)
            if (!seen) {
                setIsOpen(true)
                localStorage.setItem(STORAGE_KEY, 'true')
            }
        } catch (error) {
            console.error('Error checking announcement:', error)
        }
    }, [])

    if (!isOpen) return null

    return (
        <div className='fixed inset-0 z-[600] flex items-center justify-center bg-black/40 p-4'>
            <div className='modal-fade-in relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-zinc-900'>
                <button
                    onClick={() => setIsOpen(false)}
                    className='absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gray-100 transition-colors hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
                    aria-label='Close announcement'
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

                <h1 className={`${proximaNovaBold.className} pr-10 text-2xl`}>
                    INFO
                </h1>
                <p className='mt-4 text-lg leading-relaxed'>
                    IdolGuessr just had a big update!
                </p>
                <p className='mt-4 text-lg leading-relaxed'>
                    Check out the new features and let me know what you think!
                </p>

                <h2 className={`${proximaNovaBold.className} mt-6 text-xl`}>
                    What&apos;s new
                </h2>
                <ul className='mt-3 list-disc space-y-2 pl-5 text-lg leading-relaxed'>
                    <li>
                        Sign in to save your streak and pick a nickname.
                        You&apos;ll find it under the account button (pink
                        button top right).
                    </li>
                    <li>A leaderboard for the highest streaks.</li>
                    <li>
                        Unshuffled: put today&apos;s scrambled song back
                        together. Tap a piece to hear it, drag it into place,
                        and check which ones are right.
                    </li>
                </ul>

                <button
                    onClick={() => setIsOpen(false)}
                    className='mt-6 w-full cursor-pointer rounded-full bg-pink-500 px-4 py-2 font-medium text-white transition-colors hover:bg-pink-600'
                >
                    Got it
                </button>
            </div>
        </div>
    )
}
