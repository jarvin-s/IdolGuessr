'use server'

import { sealUnlimitedPath } from '@/lib/game/imageToken'
import { createServerSupabase } from '@/lib/supabase/server'

type Row = Record<string, unknown>

function asRows(data: unknown): Row[] {
    if (Array.isArray(data)) return data.filter((row): row is Row => !!row && typeof row === 'object')
    if (data && typeof data === 'object') return [data as Row]
    return []
}

function stripRound(row: Row): Row {
    const next = { ...row }
    next.name = ''
    delete next.alt_name
    delete next.group_name
    return next
}

function sealUnlimitedImage(row: Row): Row {
    const next = { ...row }
    const category = typeof next.group_category === 'string' ? next.group_category : ''
    const group = typeof next.base64_group === 'string' ? next.base64_group : ''
    const bucket = typeof next.img_bucket === 'string' ? next.img_bucket : ''
    if (!category || !group || !bucket) return next
    next.image_token = sealUnlimitedPath(category, group, bucket)
    delete next.base64_group
    delete next.base64_idol
    return next
}

export async function loadCurrentDaily() {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc('get_current_daily')
    if (error || !data?.length) {
        if (error) console.error('get_current_daily error:', error)
        return null
    }
    const row = { ...(data[0] as Row) }
    if (typeof row.name !== 'string' || row.name.length === 0) row.name = ''
    delete row.alt_name
    delete row.group_name
    return row as {
        id: number
        name: string
        group_type: string
        play_date: string
        img_bucket: string
        end_at: string
        server_now: string
        chosen_by: string | null
        chosen_by_url: string | null
    }
}

export async function startInfiniteRound(input: {
    difficulty: string
    imageMode: string
    group: string | null
    gens: number[] | null
    count: number
    exclude: string[] | null
    bind: boolean
}) {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc('start_infinite_round', {
        p_difficulty: input.difficulty,
        p_image_mode: input.imageMode,
        p_group: input.group,
        p_gens: input.gens,
        p_count: input.count,
        p_exclude: input.exclude,
        p_bind: input.bind,
    })
    if (error) return { rows: null as Row[] | null, error: error.message }
    return {
        rows: asRows(data).map((row) => sealUnlimitedImage(stripRound(row))),
        error: null as string | null,
    }
}

export async function loadMyOverview() {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc('get_my_overview')
    if (error || !data || typeof data !== 'object') {
        return { overview: null, error: error?.message ?? 'get_my_overview' }
    }
    const overview = data as { active_games?: unknown }
    if (Array.isArray(overview.active_games)) {
        overview.active_games = overview.active_games.map((game) => {
            if (!game || typeof game !== 'object') return game
            const row = { ...(game as Row) }
            if (row.mode !== 'infinite') return row
            if (row.idol && typeof row.idol === 'object') {
                row.idol = sealUnlimitedImage(row.idol as Row)
            }
            if (Array.isArray(row.queue)) {
                row.queue = row.queue.map((item) =>
                    item && typeof item === 'object' ? sealUnlimitedImage(item as Row) : item
                )
            }
            return row
        })
    }
    return { overview: data, error: null as string | null }
}

export async function startHangulRound(input: {
    group: string | null
    count: number
    exclude: string[] | null
    bind: boolean
}) {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc('start_hangul_round', {
        p_group: input.group,
        p_count: input.count,
        p_exclude: input.exclude,
        p_bind: input.bind,
    })
    if (error) return { rows: null as Row[] | null, error: error.message }
    return { rows: asRows(data).map(stripRound), error: null as string | null }
}

export async function revealInfiniteGroup(difficulty: string, imageMode: string) {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc('consume_round_hint', {
        p_pool: 'unlimited',
        p_difficulty: difficulty,
        p_image_mode: imageMode,
    })
    if (error || !data) {
        if (error) {
            const message = String(error.message)
            if (!message.includes('no_hints') && !message.includes('no_active_round')) {
                console.error('hint', error)
            }
        }
        return null
    }
    const row = data as { hints_remaining?: number; group_name?: string | null }
    return {
        hintsRemaining: Number(row.hints_remaining ?? 0),
        groupName: typeof row.group_name === 'string' && row.group_name.length > 0 ? row.group_name : null,
    }
}

export async function revealHangulGroup() {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase.rpc('reveal_hangul_group')
    if (error || !data) {
        if (error) {
            const message = String(error.message)
            if (!message.includes('no_active_round')) console.error('reveal_hangul_group', error)
        }
        return null
    }
    const name = (data as { group_name?: string | null }).group_name
    return typeof name === 'string' && name.length > 0 ? name : null
}
