import { SeverityNumber } from '@opentelemetry/api-logs'
import { after, NextRequest, NextResponse } from 'next/server'
import { flushPostHogLogs, posthogServerLogger } from '@/instrumentation'

export const dynamic = 'force-dynamic'

function flushLogsAfterResponse() {
    after(() => flushPostHogLogs())
}

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
        posthogServerLogger?.emit({
            body: 'unshuffled track request rejected',
            severityNumber: SeverityNumber.WARN,
            attributes: { event: 'unshuffled_track_lookup', status: 'invalid_request' },
        })
        flushLogsAfterResponse()
        return NextResponse.json({ error: 'Missing track id' }, { status: 400 })
    }

    const lookup = await fetch(
        `https://itunes.apple.com/lookup?id=${id}&entity=song`,
        { cache: 'no-store' }
    )
    if (!lookup.ok) {
        posthogServerLogger?.emit({
            body: 'unshuffled track lookup failed',
            severityNumber: SeverityNumber.ERROR,
            attributes: {
                event: 'unshuffled_track_lookup',
                status: 'upstream_failed',
                upstream_status: lookup.status,
            },
        })
        flushLogsAfterResponse()
        return NextResponse.json({ error: 'iTunes lookup failed' }, { status: 502 })
    }

    const body = (await lookup.json()) as ItunesLookup
    const track = body.results?.find(
        (item) => item.trackId === Number(id) && item.previewUrl && item.artworkUrl100
    )
    if (!track?.previewUrl || !track.artworkUrl100 || !track.trackName) {
        posthogServerLogger?.emit({
            body: 'unshuffled track preview unavailable',
            severityNumber: SeverityNumber.INFO,
            attributes: { event: 'unshuffled_track_lookup', status: 'preview_unavailable' },
        })
        flushLogsAfterResponse()
        return NextResponse.json({ error: 'Track has no preview' }, { status: 404 })
    }

    posthogServerLogger?.emit({
        body: 'unshuffled track preview delivered',
        severityNumber: SeverityNumber.INFO,
        attributes: { event: 'unshuffled_track_lookup', status: 'success' },
    })
    flushLogsAfterResponse()

    return NextResponse.json({
        trackId: track.trackId,
        trackName: track.trackName,
        artistName: track.artistName ?? '',
        previewUrl: track.previewUrl,
        artworkUrl: track.artworkUrl100.replace('100x100bb', '600x600bb'),
        trackViewUrl: track.trackViewUrl ?? null,
    })
}
