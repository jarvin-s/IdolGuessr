'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from 'react'
import posthog from 'posthog-js'
import { supabase, setAccountId } from '@/lib/supabase'
import {
    getProfile,
    importLegacyProgress,
    refreshOverview,
    signInWithGoogle,
    signOutToGuest,
    subscribePlayer,
    type PlayerProfile,
} from '@/lib/player'
import { claimAccountFeedbackTickets } from '@/utils/feedbackTickets'

interface AuthContextValue {
    ready: boolean
    profile: PlayerProfile | null
    isGuest: boolean
    signInWithGoogle: () => Promise<void>
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
    ready: false,
    profile: null,
    isGuest: true,
    signInWithGoogle,
    signOut: async () => {},
})

const posthogConfigured = Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN &&
        process.env.NEXT_PUBLIC_POSTHOG_HOST
)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [ready, setReady] = useState(false)
    const [profile, setProfile] = useState<PlayerProfile | null>(null)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        let cancelled = false
        const sync = () => setProfile(getProfile())
        const unsubscribe = subscribePlayer(sync)

        const boot = async () => {
            const { data } = await supabase.auth.getSession()
            let user = data.session?.user ?? null
            if (!user) {
                const signed = await supabase.auth.signInAnonymously()
                if (signed.error) {
                    if (!cancelled) {
                        setError(signed.error.message)
                        setReady(true)
                    }
                    return
                }
                user = signed.data.user
            }
            setAccountId(user?.id ?? null)
            await refreshOverview()
            if (posthogConfigured && user && !user.is_anonymous) {
                const profile = getProfile()
                posthog.identify(user.id, {
                    ...(user.email ? { email: user.email } : {}),
                    ...(profile?.nickname
                        ? { nickname: profile.nickname }
                        : {}),
                })
            }
            await importLegacyProgress()
            await claimAccountFeedbackTickets()
            if (!cancelled) {
                setProfile(getProfile())
                setReady(true)
            }
        }

        void boot()
        return () => {
            cancelled = true
            unsubscribe()
        }
    }, [])

    const signOut = async () => {
        if (posthogConfigured) posthog.reset()
        await signOutToGuest()
    }

    if (!ready) {
        return (
            <div className='flex min-h-screen items-center justify-center text-sm text-gray-500 dark:text-zinc-400'>
                Loading IdolGuessr…
            </div>
        )
    }

    return (
        <AuthContext.Provider
            value={{
                ready,
                profile,
                isGuest: profile?.is_anonymous !== false,
                signInWithGoogle,
                signOut,
            }}
        >
            {error ? (
                <p className='bg-amber-50 px-4 py-2 text-center text-sm text-amber-900'>
                    Sign-in is unavailable right now. Anonymous accounts need to be turned on for this project.
                </p>
            ) : null}
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext)
}
