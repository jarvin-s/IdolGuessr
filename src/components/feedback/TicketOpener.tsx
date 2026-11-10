import Image from 'next/image'
import type { TicketOpener } from '@/lib/supabase'

function providerLabel(provider: string | null): string {
    if (provider === 'google') return 'Google'
    if (provider === 'email') return 'Email'
    return 'Account'
}

function Avatar({ opener }: { opener: TicketOpener }) {
    if (opener.avatar_url) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={opener.avatar_url}
                alt=''
                className='h-10 w-10 flex-shrink-0 rounded-full object-cover'
            />
        )
    }
    const letter = (opener.nickname || opener.name || opener.email || '?')
        .slice(0, 1)
        .toUpperCase()
    return (
        <span className='flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-pink-100 text-sm font-medium text-pink-700 dark:bg-pink-950 dark:text-pink-200'>
            {letter}
        </span>
    )
}

export function TicketOpenerLine({ opener }: { opener?: TicketOpener | null }) {
    if (!opener) return <span>Guest</span>
    const label = opener.nickname || opener.name || opener.email || 'Account'
    return (
        <span className='inline-flex max-w-full min-w-0 items-center gap-1'>
            {opener.provider === 'google' && (
                <Image src='/icons/google.svg' width={12} height={12} alt='' />
            )}
            <span className='truncate'>{label}</span>
            <span className='flex-shrink-0'>
                · {providerLabel(opener.provider)}
            </span>
        </span>
    )
}

export function TicketOpenerCard({ opener }: { opener?: TicketOpener | null }) {
    if (!opener) {
        return (
            <p className='mb-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400'>
                Opened as a guest. No account is attached to this ticket.
            </p>
        )
    }

    const heading = opener.nickname || opener.name || 'Signed-in account'

    return (
        <div className='mb-3 flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950'>
            <Avatar opener={opener} />
            <div className='min-w-0'>
                <p className='truncate text-sm font-medium text-gray-900 dark:text-zinc-100'>
                    {heading}
                </p>
                {opener.email && (
                    <p className='truncate text-xs text-gray-500 dark:text-zinc-400'>
                        {opener.email}
                    </p>
                )}
                <p className='mt-0.5 flex items-center gap-1 text-[11px] tracking-wide text-gray-400 uppercase dark:text-zinc-500'>
                    {opener.provider === 'google' && (
                        <Image
                            src='/icons/google.svg'
                            width={12}
                            height={12}
                            alt=''
                        />
                    )}
                    {providerLabel(opener.provider)} account
                </p>
            </div>
        </div>
    )
}
