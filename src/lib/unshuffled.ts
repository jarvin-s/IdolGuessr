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

    const response = await fetch(`/api/unshuffled/track?id=${data.itunes_track_id}`)
    if (!response.ok) {
        throw new Error('Could not load the song preview')
    }
    const track = (await response.json()) as TrackResponse

    return {
        id: data.id,
        itunesTrackId: Number(data.itunes_track_id),
        songName: data.song_name,
        artistName: data.artist_name,
        previewUrl: track.previewUrl,
        artworkUrl: track.artworkUrl,
        trackViewUrl: track.trackViewUrl,
    }
}

export async function submitUnshuffledResult(songId: number, checks: number) {
    const { error } = await supabase.rpc('submit_unshuffled_result', {
        p_song_id: songId,
        p_checks: checks,
    })
    if (error) throw new Error(error.message)
}
