'use client'

import Image from 'next/image'
import { useEffect, useMemo, useRef, useState } from 'react'
import { idolPortrait, type ClassicCandidate } from '@/lib/classic'

export default function IdolSearchInput({
    pool,
    excludedIds,
    disabled,
    pending = false,
    onPick,
}: {
    pool: ClassicCandidate[]
    excludedIds: number[]
    disabled: boolean
    pending?: boolean
    onPick: (idol: ClassicCandidate) => void
}) {
    const [query, setQuery] = useState('')
    const [open, setOpen] = useState(false)
    const [active, setActive] = useState(0)
    const root = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const excluded = useMemo(() => new Set(excludedIds), [excludedIds])

    const matches = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return []
        return pool
            .filter((idol) => {
                const name = idol.name.toLowerCase()
                const group = idol.groupName.toLowerCase()
                return name.includes(needle) || group.includes(needle)
            })
            .sort((a, b) => {
                const aStarts = a.name.toLowerCase().startsWith(needle) ? 0 : 1
                const bStarts = b.name.toLowerCase().startsWith(needle) ? 0 : 1
                return aStarts - bStarts || a.name.localeCompare(b.name)
            })
            .slice(0, 8)
    }, [pool, query])

    useEffect(() => {
        setActive(0)
    }, [query])

    useEffect(() => {
        const close = (event: MouseEvent) => {
            if (!root.current?.contains(event.target as Node)) setOpen(false)
        }
        window.addEventListener('mousedown', close)
        return () => window.removeEventListener('mousedown', close)
    }, [])

    const fill = (idol: ClassicCandidate) => {
        if (excluded.has(idol.id)) return
        setQuery(idol.name)
        setOpen(false)
        inputRef.current?.focus()
    }

    const submit = (idol: ClassicCandidate | undefined) => {
        if (!idol || excluded.has(idol.id)) return
        setQuery('')
        setOpen(false)
        onPick(idol)
    }

    return (
        <div ref={root} className='relative w-full'>
            <input
                ref={inputRef}
                value={query}
                disabled={disabled}
                onChange={(event) => {
                    setQuery(event.target.value)
                    setOpen(true)
                }}
                onFocus={() => setOpen(true)}
                onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                        event.preventDefault()
                        setOpen(true)
                        setActive((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)))
                    } else if (event.key === 'ArrowUp') {
                        event.preventDefault()
                        setOpen(true)
                        setActive((index) => Math.max(index - 1, 0))
                    } else if (event.key === 'Enter') {
                        event.preventDefault()
                        const needle = query.trim().toLowerCase()
                        const exact = matches.find(
                            (idol) => !excluded.has(idol.id) && idol.name.toLowerCase() === needle,
                        )
                        submit(exact ?? (open ? matches[active] : undefined))
                    } else if (event.key === 'Escape') {
                        setOpen(false)
                    }
                }}
                placeholder={pending ? 'Checking...' : disabled ? 'Round finished' : 'Type an idol name...'}
                aria-label='Idol name'
                autoComplete='off'
                className='w-full rounded-full border border-zinc-300 bg-white px-4 py-3 outline-none focus:border-pink-500 disabled:border-[#3aa346] dark:border-zinc-700 dark:bg-zinc-900 dark:disabled:border-[#3aa346]'
            />
            {open && matches.length > 0 && (
                <ul className='absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
                    {matches.map((idol, index) => {
                        const guessed = excluded.has(idol.id)
                        const portrait = idolPortrait(idol)
                        return (
                            <li key={idol.id}>
                                <button
                                    type='button'
                                    disabled={guessed}
                                    onMouseEnter={() => setActive(index)}
                                    onMouseDown={(event) => event.preventDefault()}
                                    onClick={() => fill(idol)}
                                    className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                                        index === active ? 'bg-zinc-100 dark:bg-zinc-800' : ''
                                    } ${guessed ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
                                >
                                    {portrait ? (
                                        <Image
                                            src={portrait}
                                            alt=''
                                            width={36}
                                            height={36}
                                            className='h-9 w-9 rounded object-cover'
                                            unoptimized
                                        />
                                    ) : (
                                        <div className='h-9 w-9 rounded bg-zinc-200 dark:bg-zinc-800' />
                                    )}
                                    <span className='min-w-0'>
                                        <span className='block truncate font-semibold'>{idol.name}</span>
                                        <span className='block truncate text-xs text-gray-500 dark:text-zinc-400'>
                                            {idol.groupName}
                                            {guessed ? ' · Guessed' : ''}
                                        </span>
                                    </span>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
