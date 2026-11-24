import { NextResponse } from 'next/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

// The pool is identical for every player, so the CDN serves it and Postgres
// sees roughly one call per hour per region instead of one per page load.
export async function GET() {
    const key = supabaseAnonKey()
    const response = await fetch(`${supabaseUrl().replace(/\/+$/, '')}/rest/v1/rpc/get_classic_pool`, {
        method: 'POST',
        headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
        },
        body: '{}',
        cache: 'no-store',
    })
    if (!response.ok) {
        return NextResponse.json(
            { error: 'Could not load the classic pool' },
            { status: 502, headers: { 'Cache-Control': 'no-store' } },
        )
    }
    return NextResponse.json(await response.json(), {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
}
