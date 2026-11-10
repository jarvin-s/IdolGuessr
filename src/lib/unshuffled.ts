import { supabase } from '@/lib/supabase'

export interface UnshuffledSong {
    id: number
    itunesTrackId: number
    songName: string
    artistName: string
    previewUrl: string
    artworkUrl: string
    trackViewUrl: string | null
}

interface TrackResponse {
    previewUrl: string
    artworkUrl: string
    trackViewUrl: string | null
}

interface SongRow {
    id: number
    itunes_track_id: number
    song_name: string
    artist_name: string
}

async function withPreview(row: SongRow): Promise<UnshuffledSong> {
    const response = await fetch(`/api/unshuffled/track?id=${row.itunes_track_id}`)
    if (!response.ok) {
        throw new Error('Could not load the song preview')
    }
    const track = (await response.json()) as TrackResponse

    return {
        id: row.id,
        itunesTrackId: Number(row.itunes_track_id),
        songName: row.song_name,
        artistName: row.artist_name,
        previewUrl: track.previewUrl,
        artworkUrl: track.artworkUrl,
        trackViewUrl: track.trackViewUrl,
    }
}

export async function getUnshuffledSong(): Promise<UnshuffledSong> {
    const { data, error } = await supabase
        .from('unshuffled_songs')
        .select('id, itunes_track_id, song_name, artist_name')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error || !data) {
        throw new Error(error?.message ?? 'No unshuffled song is available')
    }

    return withPreview(data)
}

export async function getRandomUnshuffledSong(
    excludeId?: number
): Promise<UnshuffledSong> {
    const { count, error } = await supabase
        .from('unshuffled_songs')
        .select('id', { count: 'exact', head: true })

    if (error) throw new Error(error.message)
    const total = count ?? 0
    if (total === 0) throw new Error('No unshuffled song is available')

    let offset = Math.floor(Math.random() * total)
    let row = await songAtOffset(offset)
    if (total > 1 && excludeId !== undefined && row.id === excludeId) {
        offset = (offset + 1) % total
        row = await songAtOffset(offset)
    }

    return withPreview(row)
}

async function songAtOffset(offset: number): Promise<SongRow> {
    const { data, error } = await supabase
        .from('unshuffled_songs')
        .select('id, itunes_track_id, song_name, artist_name')
        .order('id', { ascending: true })
        .range(offset, offset)
        .maybeSingle()

    if (error || !data) {
        throw new Error(error?.message ?? 'No unshuffled song is available')
    }

    return data
}

export async function submitUnshuffledResult(
    songId: number,
    checks: number,
    timeSeconds: number
) {
    const { error } = await supabase.rpc('submit_unshuffled_result', {
        p_song_id: songId,
        p_checks: checks,
        p_time_seconds: timeSeconds,
    })
    if (error) throw new Error(error.message)
}
