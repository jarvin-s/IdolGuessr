import { supabase } from '@/lib/supabase'

export type UnshuffledMode = 'daily' | 'infinite'

export interface UnshuffledSong {
    id: number
    itunesTrackId: number
    songName: string
    artistName: string
    previewUrl: string
    artworkUrl: string
    trackViewUrl: string | null
}

export interface UnshuffledArtist {
    name: string
    songCount: number
}

export interface UnshuffledDaily {
    dailyId: number
    endAt: string
    serverNow: string
    song: UnshuffledSong
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

interface DailyRow {
    daily_id: number
    song_id: number
    itunes_track_id: number
    song_name: string
    artist_name: string
    end_at: string
    server_now: string
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

export async function getRandomUnshuffledSong({
    artists = [],
    exclude = [],
}: {
    artists?: string[]
    exclude?: number[]
} = {}): Promise<UnshuffledSong> {
    const { data, error } = await supabase
        .rpc('get_random_unshuffled_song', {
            p_artists: artists.length > 0 ? artists : null,
            p_exclude: exclude,
        })
        .maybeSingle<SongRow>()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('No unshuffled song is available')

    return withPreview(data)
}

export async function getUnshuffledArtists(): Promise<UnshuffledArtist[]> {
    const { data, error } = await supabase.rpc('get_unshuffled_artists')
    if (error) throw new Error(error.message)

    return ((data ?? []) as { artist_name: string; song_count: number }[]).map(
        (row) => ({ name: row.artist_name, songCount: row.song_count })
    )
}

export async function getCurrentUnshuffledDaily(): Promise<UnshuffledDaily> {
    const { data, error } = await supabase
        .rpc('get_current_unshuffled_daily')
        .maybeSingle<DailyRow>()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('There is no song today')

    const song = await withPreview({
        id: data.song_id,
        itunes_track_id: data.itunes_track_id,
        song_name: data.song_name,
        artist_name: data.artist_name,
    })

    return {
        dailyId: Number(data.daily_id),
        endAt: data.end_at,
        serverNow: data.server_now,
        song,
    }
}

export async function submitUnshuffledResult(
    songId: number,
    checks: number,
    timeSeconds: number,
    mode: UnshuffledMode,
    dailyId?: number
) {
    const { error } = await supabase.rpc('submit_unshuffled_result', {
        p_song_id: songId,
        p_checks: checks,
        p_time_seconds: timeSeconds,
        p_mode: mode,
        p_daily_id: mode === 'daily' ? (dailyId ?? null) : null,
    })
    if (error) throw new Error(error.message)
}
