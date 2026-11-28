import type { Session } from '@supabase/supabase-js'

const STORAGE_KEY = 'idolguessr-auth-backup'

let memory: Session | null = null

function storage(): Storage | null {
    if (typeof window === 'undefined') return null
    try {
        return window.localStorage
    } catch {
        return null
    }
}

function isSession(value: unknown): value is Session {
    if (!value || typeof value !== 'object') return false
    const session = value as Session
    return typeof session.access_token === 'string' && typeof session.refresh_token === 'string'
}

export function rememberBrowserSession(session: Session | null) {
    memory = session
    const store = storage()
    if (!store) return
    try {
        if (!session) store.removeItem(STORAGE_KEY)
        else store.setItem(STORAGE_KEY, JSON.stringify(session))
    } catch {
        // Private mode and some in-app browsers reject storage. Memory still covers this page.
    }
}

export function clearBrowserSession() {
    rememberBrowserSession(null)
}

export function readBrowserSession(): Session | null {
    if (memory?.access_token) return memory
    const store = storage()
    if (!store) return null
    try {
        const raw = store.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed: unknown = JSON.parse(raw)
        if (!isSession(parsed)) return null
        memory = parsed
        return parsed
    } catch {
        return null
    }
}

export function accessTokenStillValid(session: Session, marginMs = 60_000) {
    if (!session.expires_at) return true
    return session.expires_at * 1000 - Date.now() > marginMs
}

// The gameplay client reads its session from document.cookie on every request.
// On mobile Safari that read goes empty while the cookie is still sent to this
// site, so REST calls leave as the anon role and Postgres raises not_authenticated.
// Put the last real access token back on those calls.
export function withBackupAccessToken(
    anonKey: string,
    input: RequestInfo | URL,
    init: RequestInit | undefined,
): { headers: Headers } | null {
    const session = readBrowserSession()
    if (!session?.access_token || !accessTokenStillValid(session, 0)) return null
    const url =
        input instanceof Request
            ? input.url
            : input instanceof URL
              ? input.toString()
              : String(input)
    if (!url.includes('/rest/v1/')) return null

    const headers = new Headers(input instanceof Request ? input.headers : undefined)
    if (init?.headers) new Headers(init.headers).forEach((value, key) => headers.set(key, value))
    const authorization = headers.get('Authorization')
    if (authorization && authorization !== `Bearer ${anonKey}`) return null
    headers.set('Authorization', `Bearer ${session.access_token}`)
    return { headers }
}
