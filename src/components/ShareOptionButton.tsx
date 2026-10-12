'use client'

import { ReactNode } from 'react'

interface ShareOptionButtonProps {
    onClick: () => void
    disabled?: boolean
    variant: 'primary' | 'secondary'
    isLoading?: boolean
    isCopied?: boolean
    icon: ReactNode
    label: string
}

export default function ShareOptionButton({
    onClick,
    disabled = false,
    variant,
    isLoading = false,
    isCopied = false,
    icon,
    label,
}: ShareOptionButtonProps) {
    const baseClasses =
        'flex w-full cursor-pointer items-center justify-center gap-3 rounded-full px-6 py-4 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50'

    const variantClasses = {
        primary: 'bg-black text-white hover:bg-gray-800',
        secondary:
            'border-2 border-black dark:border-zinc-100 bg-white dark:bg-zinc-900 text-black dark:text-zinc-100 hover:bg-gray-200 dark:hover:bg-zinc-700',
    }

    const renderContent = () => {
        if (isLoading) {
            return (
                <>
                    <div className='h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent' />
                    Generating...
                </>
            )
        }

        if (isCopied) {
            return (
                <>
                    <svg
                        className='h-5 w-5'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M5 13l4 4L19 7'
                        />
                    </svg>
                    Copied!
                </>
            )
        }

        return (
            <>
                {icon}
                {label}
            </>
        )
    }

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variantClasses[variant]}`}
        >
            {renderContent()}
        </button>
    )
}

