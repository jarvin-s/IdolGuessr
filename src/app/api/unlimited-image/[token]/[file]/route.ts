import { openUnlimitedPath } from '@/lib/game/imageToken'
import { supabaseUrl } from '@/lib/supabase/env'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const FILE_NAME = /^(00[1-6]|clear)\.png$/

export async function GET(
    _request: Request,
    context: { params: Promise<{ token: string; file: string }> }
) {
    const { token, file } = await context.params
    if (!FILE_NAME.test(file)) return new NextResponse(null, { status: 404 })

    const path = openUnlimitedPath(token)
    if (!path) return new NextResponse(null, { status: 404 })

    const upstream = await fetch(
        `${supabaseUrl()}/storage/v1/object/public/images/unlimited/${path.category}/${path.group}/${path.bucket}/${file}`,
        { cache: 'force-cache' }
    )
    if (!upstream.ok || !upstream.body) return new NextResponse(null, { status: 404 })

    return new NextResponse(upstream.body, {
        headers: {
            'Content-Type': upstream.headers.get('content-type') || 'image/png',
            'Cache-Control': 'private, max-age=86400',
        },
    })
}
