import { NextResponse } from 'next/server'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env'

export const dynamic = 'force-dynamic'

// Players already on the site get changes over the `announcements` broadcast,
// so a short CDN cache only delays the banner for fresh page loads.
export async function GET() {
    const key = supabaseAnonKey()
    const params = new URLSearchParams({
        select: 'id,message,display_seconds,is_active,created_at,updated_at',
        is_active: 'eq.true',
        limit: '1',
    })
    const response = await fetch(`${supabaseUrl().replace(/\/+$/, '')}/rest/v1/announcements?${params}`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        cache: 'no-store',
    })
    if (!response.ok) {
        return NextResponse.json(
            { error: 'Could not load the announcement' },
            { status: 502, headers: { 'Cache-Control': 'no-store' } },
        )
    }
    const rows = (await response.json()) as unknown[]
    return NextResponse.json(rows[0] ?? null, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
    })
}
