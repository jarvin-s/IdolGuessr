'use client'

import { useEffect, useState } from 'react'

interface HangulGameOverModalProps {
    isOpen: boolean
    currentStreak: number
    onPlayAgain: () => void
}

export default function HangulGameOverModal({
    isOpen,
    currentStreak,
    onPlayAgain,
}: HangulGameOverModalProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setIsVisible(true), 100)
        } else {
            setIsVisible(false)
        }
    }, [isOpen])

    if (!isOpen) return null

    return (
        <div
            className={`pointer-events-none absolute inset-0 z-[250] flex items-center justify-center transition-opacity duration-300 ${
                isVisible ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div className='absolute inset-0 bg-black/70 backdrop-blur-md' />
            <div className='relative z-10 flex flex-col items-center gap-6 px-8'>
                <div className='text-center'>
                    <h2 className='mb-4 text-5xl font-black text-white uppercase'>
                        Game Over
                    </h2>
                    <p className='flex items-center justify-center gap-1 text-2xl font-semibold text-white/90'>
                        Your streak:{' '}
                        <span className='font-black text-white'></span>
                        {currentStreak} <FireIcon />
                    </p>
                </div>
                <div className='flex flex-col gap-3'>
                    <button
                        onClick={onPlayAgain}
                        className='pointer-events-auto cursor-pointer rounded-full bg-black px-6 py-2 text-lg font-bold text-white transition-all hover:bg-[#141414]'
                    >
                        PLAY AGAIN
                    </button>
                </div>
            </div>
        </div>
    )
}

function FireIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='32'
            height='32'
            viewBox='0 0 24 24'
        >
            <path
                fill='#e09200'
                d='M12.832 21.801c3.126-.626 7.168-2.875 7.168-8.69c0-5.291-3.873-8.815-6.658-10.434c-.619-.36-1.342.113-1.342.828v1.828c0 1.442-.606 4.074-2.29 5.169c-.86.559-1.79-.278-1.894-1.298l-.086-.838c-.1-.974-1.092-1.565-1.87-.971C4.461 8.46 3 10.33 3 13.11C3 20.221 8.289 22 10.933 22q.232 0 .484-.015c.446-.056 0 .099 1.415-.185'
            />
            <path
                fill='#faeb9f'
                d='M8 18.444c0 2.62 2.111 3.43 3.417 3.542c.446-.056 0 .099 1.415-.185C13.871 21.434 15 20.492 15 18.444c0-1.297-.819-2.098-1.46-2.473c-.196-.115-.424.03-.441.256c-.056.718-.746 1.29-1.215.744c-.415-.482-.59-1.187-.59-1.638v-.59c0-.354-.357-.59-.663-.408C9.495 15.008 8 16.395 8 18.445'
            />
        </svg>
    )
}
