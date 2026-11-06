import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const OTP_TYPES = [
    'signup',
    'invite',
    'magiclink',
    'recovery',
    'email_change',
    'email',
] as const

type OtpType = (typeof OTP_TYPES)[number]

function isOtpType(value: string): value is OtpType {
    return (OTP_TYPES as readonly string[]).includes(value)
}

function nicknameFromOverview(data: unknown) {
    if (!data || typeof data !== 'object' || !('profile' in data)) return ''
    const profile = (data as { profile?: { nickname?: string | null } }).profile
    return profile?.nickname?.trim() ?? ''
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type')
    const supabase = await createServerSupabase()

    let signedIn = false
    if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        signedIn = !error
    } else if (tokenHash && type && isOtpType(type)) {
        const { error } = await supabase.auth.verifyOtp({
            type,
            token_hash: tokenHash,
        })
        signedIn = !error
    }

    if (!signedIn) {
        return NextResponse.redirect(`${origin}/sign-in?auth=error`)
    }

    const cookie = request.headers.get('cookie') ?? ''
    const match = cookie.match(/(?:^|;\s*)ig_merge_code=([^;]+)/)
    if (match?.[1]) {
        await supabase.rpc('merge_guest_into', {
            p_code: decodeURIComponent(match[1]),
        })
    }
    await supabase.rpc('touch_profile')

    const { data } = await supabase.rpc('get_my_overview')
    const dest = nicknameFromOverview(data) ? '/profile' : '/sign-in'
    const response = NextResponse.redirect(`${origin}${dest}`)
    response.cookies.set('ig_merge_code', '', { path: '/', maxAge: 0 })
    return response
}
