import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/profile'
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/profile'

    if (code) {
        const supabase = await createServerSupabase()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (!error) {
            const cookie = request.headers.get('cookie') ?? ''
            const match = cookie.match(/(?:^|;\s*)ig_merge_code=([^;]+)/)
            if (match?.[1]) {
                await supabase.rpc('merge_guest_into', { p_code: decodeURIComponent(match[1]) })
            }
            await supabase.rpc('touch_profile')
            const response = NextResponse.redirect(`${origin}${safeNext}`)
            response.cookies.set('ig_merge_code', '', { path: '/', maxAge: 0 })
            return response
        }
    }

    return NextResponse.redirect(`${origin}/?auth=error`)
}
