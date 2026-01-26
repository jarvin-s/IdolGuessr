import Image from 'next/image'
import { useState } from 'react'
import FilterModal from '../filters/FilterModal'

interface GameHeaderProps {
    timer: string
    onShowStats: () => void
    onShowInfo?: () => void
    gameMode: 'daily' | 'unlimited' | 'hangul'
    onGameModeChange: (
        mode: 'daily' | 'unlimited',
        filter?: 'boy-group' | 'girl-group' | 'both'
    ) => void
    showModeToggle?: boolean
    currentStreak?: number
    onLogoClick?: () => void
    isChallenge?: boolean
}

const meshGradient =
    'linear-gradient(115deg, #fc67fa 0%, #f4c4f3 43%,#7fd6fb 67%, #7f53ac 100%)'

export default function GameHeader({
    timer,
    onShowStats,
    onShowInfo,
    gameMode,
    onGameModeChange,
    showModeToggle = true,
    currentStreak,
    onLogoClick,
    isChallenge = false,
}: GameHeaderProps) {
    const [showFilterModal, setShowFilterModal] = useState(false)

    return (
        <>
            <div className='flex w-full flex-shrink-0 flex-col gap-3 p-4'>
                <div className='flex w-full items-center justify-between'>
                    <div className='flex items-center justify-start'>
                        <button
                            onClick={() => {
                                onLogoClick?.()
                            }}
                            className='cursor-pointer transition-opacity hover:opacity-80'
                            aria-label='Go to home screen'
                        >
                            <Image
                                src='/images/idolguessr-logo.png'
                                alt='IdolGuessr Logo'
                                width={150}
                                height={50}
                                className='h-10 w-auto'
                            />
                        </button>
                    </div>

                    {isChallenge && (
                        <div className='flex items-center justify-end'>
                            <div className='rounded-full bg-gradient-to-r from-pink-500 to-pink-600 px-3.5 py-1.5'>
                                <h1 className='text-sm font-bold tracking-widest text-white uppercase'>
                                    Challenge
                                </h1>
                            </div>
                        </div>
                    )}

                    {gameMode === 'unlimited' && !isChallenge && (
                        <div className='flex items-center justify-end'>
                            <div
                                className='rounded-full px-3.5 py-1.5'
                                style={{
                                    background: meshGradient,
                                }}
                            >
                                <h1 className='text-sm font-bold tracking-widest text-white uppercase'>
                                    Infinite
                                </h1>
                            </div>
                        </div>
                    )}

                    {gameMode === 'hangul' && (
                        <div className='flex items-center justify-end'>
                            <div className='rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-3.5 py-1.5'>
                                <h1 className='text-sm font-bold tracking-widest text-white uppercase'>
                                    Hangul
                                </h1>
                            </div>
                        </div>
                    )}

                    <div className='flex items-center gap-2'>
                        {gameMode === 'daily' && (
                            <div className='flex flex-col items-end text-right'>
                                <div className='text-xs font-medium text-gray-400'>
                                    NEXT IDOL
                                </div>
                                <div className='font-mono text-lg leading-none font-bold text-black'>
                                    {timer}
                                </div>
                            </div>
                        )}

                        {(gameMode === 'unlimited' || gameMode === 'hangul') &&
                            !isChallenge &&
                            currentStreak !== undefined &&
                            currentStreak >= 5 && (
                                <div className='flex items-center gap-1'>
                                    <FireIcon />
                                    <span className='text-2xl font-bold text-[#e09200]'>
                                        {currentStreak}
                                    </span>
                                </div>
                            )}

                        <button
                            onClick={() => {
                                onLogoClick?.()
                            }}
                            className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200'
                        >
                            <HomeIcon />
                        </button>

                        <button
                            onClick={onShowStats}
                            className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200'
                            aria-label='View Statistics'
                        >
                            <StatsIcon />
                        </button>

                        {onShowInfo && (
                            <button
                                onClick={onShowInfo}
                                className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-gray-100 transition-colors hover:bg-gray-200'
                                aria-label='View Info'
                            >
                                <InfoIcon />
                            </button>
                        )}

                        {showModeToggle && (
                            <button
                                onClick={() => {
                                    if (gameMode === 'daily') {
                                        setShowFilterModal(true)
                                    } else {
                                        onGameModeChange('daily')
                                    }
                                }}
                                className='flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg transition-colors'
                                aria-label='View Game Mode'
                                style={
                                    gameMode === 'daily'
                                        ? { background: meshGradient }
                                        : { background: 'black' }
                                }
                            >
                                <GameModeIcon gameMode={gameMode} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showModeToggle && (
                <FilterModal
                    isOpen={showFilterModal}
                    onClose={() => setShowFilterModal(false)}
                    onConfirm={(filter) => {
                        setShowFilterModal(false)
                        onGameModeChange('unlimited', filter)
                    }}
                />
            )}
        </>
    )
}

function StatsIcon() {
    return (
        <svg
            className='h-5 w-5 text-gray-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
        >
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
            />
        </svg>
    )
}

function GameModeIcon({ gameMode }: { gameMode: 'daily' | 'unlimited' | 'hangul' }) {
    if (gameMode === 'unlimited' || gameMode === 'hangul') {
        return (
            <svg
                xmlns='http://www.w3.org/2000/svg'
                width='23'
                height='23'
                viewBox='0 0 24 24'
            >
                <path
                    fill='white'
                    d='M9 3V1h6v2zm3 19q-1.85 0-3.488-.712T5.65 19.35t-1.937-2.863T3 13t.713-3.488T5.65 6.65t2.863-1.937T12 4q1.55 0 2.975.5t2.675 1.45l1.4-1.4l1.4 1.4l-1.4 1.4Q20 8.6 20.5 10.025T21 13q0 1.85-.713 3.488T18.35 19.35t-2.863 1.938T12 22m-2-5l6-4l-6-4z'
                />
            </svg>
        )
    }
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            width='23'
            height='23'
            viewBox='0 0 56 56'
        >
            <path
                fill='white'
                d='M28 20.851C30.784 16.773 36.045 14 41 14c7.18 0 13 5.82 13 13s-5.82 13-13 13c-4.955 0-10.216-2.773-13-6.851C25.216 37.227 19.955 40 15 40C7.82 40 2 34.18 2 27s5.82-13 13-13c4.955 0 10.216 2.773 13 6.851M15 34c4.475 0 9-3.732 9-7s-4.525-7-9-7a7 7 0 1 0 0 14m26 0a7 7 0 0 0 0-14c-4.475 0-9 3.732-9 7s4.525 7 9 7'
            />
        </svg>
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

function HomeIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-6 w-6'
            viewBox='0 0 24 24'
        >
            <path
                fill='none'
                stroke='#4a5565'
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='m4 12l8-8l8 8M6 10.5V19a1 1 0 0 0 1 1h3v-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3h3a1 1 0 0 0 1-1v-8.5'
            />
        </svg>
    )
}

function InfoIcon() {
    return (
        <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-5 w-5 text-gray-600'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
        >
            <circle cx='12' cy='12' r='10' strokeWidth='2' />
            <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth='2'
                d='M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3m.08 4h.01'
            />
        </svg>
    )
}
