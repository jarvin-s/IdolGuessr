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
    const [pinnedId, setPinnedId] = useState<number | null>(null)
    const [keyboardPick, setKeyboardPick] = useState(false)
    const [hover, setHover] = useState(-1)
    const root = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const fromSelection = useRef(false)
    const skipOpen = useRef(false)
    const excluded = useMemo(() => new Set(excludedIds), [excludedIds])

    const sharedNames = useMemo(() => {
        const counts = new Map<string, number>()
        for (const idol of pool) {
            const key = idol.name.trim().toLowerCase()
            counts.set(key, (counts.get(key) ?? 0) + 1)
        }
        const shared = new Set<string>()
        for (const [key, count] of counts) {
            if (count > 1) shared.add(key)
        }
        return shared
    }, [pool])

    const isShared = (name: string) =>
        sharedNames.has(name.trim().toLowerCase())

    const matches = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return []
        const rank = (a: ClassicCandidate, b: ClassicCandidate) => {
            const aStarts = a.name.toLowerCase().startsWith(needle) ? 0 : 1
            const bStarts = b.name.toLowerCase().startsWith(needle) ? 0 : 1
            return (
                aStarts - bStarts ||
                a.name.localeCompare(b.name) ||
                a.groupName.localeCompare(b.groupName)
            )
        }
        const groupKey = (idol: ClassicCandidate) =>
            idol.groupName.trim().toLowerCase()
        const matchedGroups = new Set<string>()
        for (const idol of pool) {
            const group = groupKey(idol)
            if (!group) continue
            if (
                group.startsWith(needle) ||
                (needle.length >= 3 && group.includes(needle))
            ) {
                matchedGroups.add(group)
            }
        }
        const showWholeGroup =
            matchedGroups.size === 1 ||
            (needle.length >= 3 &&
                matchedGroups.size > 1 &&
                matchedGroups.size <= 3)
        const ranked = pool
            .filter((idol) => {
                const name = idol.name.toLowerCase()
                const group = groupKey(idol)
                return name.includes(needle) || group.includes(needle)
            })
            .sort(rank)
        const cap = (list: ClassicCandidate[]) => {
            const visible = list.slice(0, 8)
            const lastName = visible[visible.length - 1]?.name
                .trim()
                .toLowerCase()
            if (!lastName || !sharedNames.has(lastName)) return visible
            const rest = list
                .slice(8)
                .filter((idol) => idol.name.trim().toLowerCase() === lastName)
            return rest.length > 0 ? [...visible, ...rest] : visible
        }
        if (!showWholeGroup) return cap(ranked)
        const members = ranked.filter((idol) =>
            matchedGroups.has(groupKey(idol))
        )
        const others = ranked.filter(
            (idol) => !matchedGroups.has(groupKey(idol))
        )
        return [...members, ...cap(others)]
    }, [pool, query, sharedNames])

    const pinned =
        pinnedId == null ? undefined : pool.find((idol) => idol.id === pinnedId)
    const queryIsAmbiguous = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return false
        let count = 0
        for (const idol of matches) {
            if (
                excluded.has(idol.id) ||
                idol.name.trim().toLowerCase() !== needle
            )
                continue
            count += 1
            if (count > 1) return true
        }
        return false
    }, [excluded, matches, query])
    const showGroup =
        !!pinned &&
        isShared(pinned.name) &&
        pinned.name.trim().toLowerCase() === query.trim().toLowerCase()

    useEffect(() => {
        if (fromSelection.current) {
            fromSelection.current = false
            return
        }
        setActive(0)
        setKeyboardPick(false)
        setPinnedId(null)
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
        if (query !== idol.name) fromSelection.current = true
        skipOpen.current = document.activeElement !== inputRef.current
        setPinnedId(idol.id)
        setKeyboardPick(false)
        setQuery(idol.name)
        setActive(
            Math.max(
                matches.findIndex((match) => match.id === idol.id),
                0
            )
        )
        setOpen(false)
        inputRef.current?.focus()
    }

    const submit = (idol: ClassicCandidate | undefined) => {
        if (!idol || excluded.has(idol.id)) return
        setPinnedId(null)
        setKeyboardPick(false)
        setQuery('')
        setOpen(false)
        onPick(idol)
    }

    const guessOnEnter = () => {
        const needle = query.trim().toLowerCase()
        const available = (
            idol: ClassicCandidate | undefined
        ): idol is ClassicCandidate => !!idol && !excluded.has(idol.id)
        const highlighted = matches[active]

        if (open && keyboardPick && available(highlighted)) return highlighted
        if (
            pinned &&
            available(pinned) &&
            pinned.name.trim().toLowerCase() === needle
        ) {
            return pinned
        }

        const exact = matches.filter(
            (idol) =>
                available(idol) && idol.name.trim().toLowerCase() === needle
        )
        if (exact.length === 1) return exact[0]
        if (exact.length > 1) return null
        if (matches.length === 1 && available(matches[0])) return matches[0]
        if (open && available(highlighted)) return highlighted
        if (open && available(matches[0])) return matches[0]
        return null
    }

    const showGuess = !(disabled && !pending)

    const guess = () => {
        const chosen = guessOnEnter()
        if (!chosen) {
            setOpen(true)
            return
        }
        submit(chosen)
    }

    return (
        <div ref={root} className='relative w-full'>
            <div
                className={`flex items-center rounded-full border bg-white focus-within:border-pink-500 dark:bg-zinc-900 ${
                    disabled
                        ? 'border-[#3aa346]'
                        : 'border-zinc-300 dark:border-zinc-700'
                }`}
            >
                <input
                    ref={inputRef}
                    value={query}
                    disabled={disabled}
                    onChange={(event) => {
                        fromSelection.current = false
                        setPinnedId(null)
                        setKeyboardPick(false)
                        setQuery(event.target.value)
                        setOpen(true)
                    }}
                    onFocus={() => {
                        if (skipOpen.current) {
                            skipOpen.current = false
                            return
                        }
                        setOpen(true)
                    }}
                    onKeyDown={(event) => {
                        if (
                            event.key === 'ArrowDown' ||
                            event.key === 'ArrowUp'
                        ) {
                            event.preventDefault()
                            const next =
                                event.key === 'ArrowDown'
                                    ? Math.min(
                                          active + 1,
                                          Math.max(matches.length - 1, 0)
                                      )
                                    : Math.max(active - 1, 0)
                            const idol = matches[next]
                            setOpen(true)
                            setKeyboardPick(true)
                            setActive(next)
                            if (
                                idol &&
                                !excluded.has(idol.id) &&
                                idol.name.trim().toLowerCase() ===
                                    query.trim().toLowerCase()
                            ) {
                                setPinnedId(idol.id)
                            }
                        } else if (event.key === 'Enter') {
                            event.preventDefault()
                            guess()
                        } else if (event.key === 'Escape') {
                            setOpen(false)
                        }
                    }}
                    placeholder={
                        pending
                            ? 'Checking...'
                            : disabled
                              ? 'Round finished'
                              : 'Type an idol or group name...'
                    }
                    aria-label='Idol name'
                    autoComplete='off'
                    className='min-w-0 flex-1 bg-transparent px-4 py-3 outline-none'
                />
                {showGroup && pinned && (
                    <span
                        className={`max-w-[40%] shrink truncate rounded-full bg-pink-600 px-2.5 py-1 text-xs font-bold text-white ${
                            showGuess ? 'mr-1' : 'mr-3'
                        }`}
                    >
                        {pinned.groupName}
                    </span>
                )}
                {showGuess && (
                    <button
                        type='button'
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={guess}
                        disabled={disabled || pending || !query.trim()}
                        tabIndex={-1}
                        className='mr-1.5 shrink-0 cursor-pointer rounded-full bg-pink-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-pink-500 disabled:cursor-not-allowed disabled:opacity-40'
                    >
                        GUESS
                    </button>
                )}
            </div>
            {open && matches.length > 0 && (
                <ul className='absolute z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900'>
                    {matches.map((idol, index) => {
                        const guessed = excluded.has(idol.id)
                        const portrait = idolPortrait(idol)
                        const shared = isShared(idol.name)
                        const marked =
                            hover === index ||
                            (keyboardPick && index === active) ||
                            (!queryIsAmbiguous &&
                                !keyboardPick &&
                                hover < 0 &&
                                index === active)
                        return (
                            <li key={idol.id}>
                                <button
                                    type='button'
                                    disabled={guessed}
                                    aria-label={
                                        shared && idol.groupName
                                            ? `${idol.name}, ${idol.groupName}`
                                            : idol.name
                                    }
                                    onMouseEnter={() => setHover(index)}
                                    onMouseLeave={() =>
                                        setHover((current) =>
                                            current === index ? -1 : current
                                        )
                                    }
                                    onMouseDown={(event) =>
                                        event.preventDefault()
                                    }
                                    onClick={() => fill(idol)}
                                    className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                                        marked
                                            ? 'bg-zinc-100 dark:bg-zinc-800'
                                            : ''
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
                                        <span className='flex min-w-0 items-center gap-2'>
                                            <span className='truncate font-semibold'>
                                                {idol.name}
                                            </span>
                                            {shared && idol.groupName && (
                                                <span className='max-w-[55%] shrink truncate rounded-full bg-pink-600/15 px-2 py-0.5 text-[11px] font-bold text-pink-700 dark:bg-pink-500/20 dark:text-pink-300'>
                                                    {idol.groupName}
                                                </span>
                                            )}
                                        </span>
                                        {(!shared || guessed) && (
                                            <span className='block truncate text-xs text-gray-500 dark:text-zinc-400'>
                                                {shared
                                                    ? 'Guessed'
                                                    : idol.groupName}
                                                {!shared && guessed
                                                    ? ' · Guessed'
                                                    : ''}
                                            </span>
                                        )}
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
