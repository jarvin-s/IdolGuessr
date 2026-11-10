import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface ItunesTrack {
    trackId?: number
    trackName?: string
    artistName?: string
    previewUrl?: string
    artworkUrl100?: string
    trackViewUrl?: string
}

interface ItunesLookup {
    results?: ItunesTrack[]
}

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get('id')
    if (!id || !/^\d+$/.test(id)) {
        return NextResponse.json({ error: 'Missing track id' }, { status: 400 })
    }

    const lookup = await fetch(
        `https://itunes.apple.com/lookup?id=${id}&entity=song`,
        { cache: 'no-store' }
    )
    if (!lookup.ok) {
        return NextResponse.json({ error: 'iTunes lookup failed' }, { status: 502 })
    }

    const body = (await lookup.json()) as ItunesLookup
    const track = body.results?.find(
        (item) => item.trackId === Number(id) && item.previewUrl && item.artworkUrl100
    )
    if (!track?.previewUrl || !track.artworkUrl100 || !track.trackName) {
        return NextResponse.json({ error: 'Track has no preview' }, { status: 404 })
    }

    return NextResponse.json({
        trackId: track.trackId,
        trackName: track.trackName,
        artistName: track.artistName ?? '',
        previewUrl: track.previewUrl,
        artworkUrl: track.artworkUrl100.replace('100x100bb', '600x600bb'),
        trackViewUrl: track.trackViewUrl ?? null,
    })
}
