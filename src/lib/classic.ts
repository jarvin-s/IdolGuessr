import { getImageUrl, supabase } from '@/lib/supabase'
import { applyClassicGame, getClassicGame, noteClassicStreak, type StreakRow } from '@/lib/player'

export type ClassicMode = 'daily' | 'infinite'
export type ClassicStatus = 'in_progress' | 'won' | 'gave_up'
export type AttributeStatus = 'correct' | 'partial' | 'wrong' | 'higher' | 'lower'
export type ClassicGroup = 'boy-group' | 'girl-group' | 'both'

export interface AttributeCell {
    value: string | number | null
    status: AttributeStatus
    matched?: string[]
}

export interface ClassicFeedback {
    id: number
    name: string
    group_category: string
    base64_group: string
    img_bucket: string
    group: AttributeCell
    gender: AttributeCell
    gen: AttributeCell
    agency: AttributeCell
    nationality: AttributeCell
    positions: AttributeCell
    birth_year: AttributeCell
    height: AttributeCell
}

export interface ClassicAnswer {
    id: number
    name: string
    group_name: string
    group_category: string
    base64_group: string
    img_bucket: string
    gender: string
    gen: number | null
    agency: string
    nationality: string
    positions: string
    birth_year: number
    height: number
}

export interface ClassicCandidate {
    id: number
    name: string
    groupName: string
    groupCategory: string
    base64Group: string
    imgBucket: string
}

export interface ClassicGame {
    guesses: ClassicFeedback[]
    status: ClassicStatus | null
    groupFilter: ClassicGroup
    dailyId: number | null
    answer: ClassicAnswer | null
}

export interface ClassicDaily {
    dailyId: number
    endAt: string
    serverNow: string
    winCount: number
    game: ClassicGame
}

const COLUMNS = ['group', 'gender', 'gen', 'agency', 'nationality', 'positions', 'birth_year', 'height'] as const

let poolPromise: Promise<ClassicCandidate[]> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value)
}

function matchedList(value: unknown): string[] | undefined {
    if (!Array.isArray(value)) return undefined
    const items = value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    return items.length > 0 ? items : undefined
}

function cell(value: unknown): AttributeCell {
    const record = isRecord(value) ? value : {}
    const raw = record.value
    const status = record.status
    return {
        value: typeof raw === 'string' || typeof raw === 'number' ? raw : raw == null ? null : String(raw),
        status:
            status === 'correct' || status === 'partial' || status === 'wrong' || status === 'higher' || status === 'lower'
                ? status
                : 'wrong',
        matched: matchedList(record.matched),
    }
}

function feedback(value: unknown): ClassicFeedback | null {
    if (!isRecord(value) || typeof value.name !== 'string') return null
    const id = typeof value.id === 'number' ? value.id : Number(value.id)
    if (!Number.isFinite(id)) return null
    return {
        id,
        name: value.name,
        group_category: typeof value.group_category === 'string' ? value.group_category : '',
        base64_group: typeof value.base64_group === 'string' ? value.base64_group : '',
        img_bucket: typeof value.img_bucket === 'string' ? value.img_bucket : '',
        group: cell(value.group),
        gender: cell(value.gender),
        gen: cell(value.gen),
        agency: cell(value.agency),
        nationality: cell(value.nationality),
        positions: cell(value.positions),
        birth_year: cell(value.birth_year),
        height: cell(value.height),
    }
}

function feedbackList(value: unknown): ClassicFeedback[] {
    if (!Array.isArray(value)) return []
    return value.flatMap((row) => {
        const parsed = feedback(row)
        return parsed ? [parsed] : []
    })
}

function answer(value: unknown): ClassicAnswer | null {
    if (!isRecord(value) || typeof value.name !== 'string') return null
    const id = typeof value.id === 'number' ? value.id : Number(value.id)
    if (!Number.isFinite(id)) return null
    return {
        id,
        name: value.name,
        group_name: typeof value.group_name === 'string' ? value.group_name : '',
        group_category: typeof value.group_category === 'string' ? value.group_category : '',
        base64_group: typeof value.base64_group === 'string' ? value.base64_group : '',
        img_bucket: typeof value.img_bucket === 'string' ? value.img_bucket : '',
        gender: typeof value.gender === 'string' ? value.gender : '',
        gen: typeof value.gen === 'number' ? value.gen : null,
        agency: typeof value.agency === 'string' ? value.agency : '',
        nationality: typeof value.nationality === 'string' ? value.nationality : '',
        positions: typeof value.positions === 'string' ? value.positions : '',
        birth_year: typeof value.birth_year === 'number' ? value.birth_year : 0,
        height: typeof value.height === 'number' ? value.height : 0,
    }
}

function remember(
    difficulty: 'daily' | 'infinite',
    row: Record<string, unknown>,
    extra?: { dailyId?: number | null; groupFilter?: ClassicGroup },
) {
    const current = getClassicGame(difficulty)
    const status = row.status
    applyClassicGame(difficulty, {
        guesses: feedbackList(row.guesses ?? current?.guesses ?? []),
        status: status === 'in_progress' || status === 'won' || status === 'gave_up' ? status : (current?.status ?? null),
        groupFilter:
            extra?.groupFilter ??
            (row.group_filter === 'boy-group' || row.group_filter === 'girl-group' || row.group_filter === 'both'
                ? row.group_filter
                : undefined),
        dailyId: extra?.dailyId === undefined ? undefined : extra.dailyId,
        answer: row.answer === undefined ? undefined : answer(row.answer),
    })
}

export function idolPortrait(idol: {
    groupCategory?: string
    group_category?: string
    base64Group?: string
    base64_group?: string
    imgBucket?: string
    img_bucket?: string
}) {
    return getImageUrl(
        '',
        idol.imgBucket ?? idol.img_bucket ?? '',
        'clear',
        'unlimited',
        idol.groupCategory ?? idol.group_category,
        idol.base64Group ?? idol.base64_group,
    )
}

export function getClassicPool(): Promise<ClassicCandidate[]> {
    if (!poolPromise) {
        poolPromise = (async () => {
            const { data, error } = await supabase.rpc('get_classic_pool')
            if (error) throw new Error(error.message)
            return ((data ?? []) as Array<Record<string, unknown>>).flatMap((row): ClassicCandidate[] => {
                const id = typeof row.id === 'number' ? row.id : Number(row.id)
                if (!Number.isFinite(id) || typeof row.name !== 'string') return []
                return [
                    {
                        id,
                        name: row.name,
                        groupName: typeof row.group_name === 'string' ? row.group_name : '',
                        groupCategory: typeof row.group_category === 'string' ? row.group_category : '',
                        base64Group: typeof row.base64_group === 'string' ? row.base64_group : '',
                        imgBucket: typeof row.img_bucket === 'string' ? row.img_bucket : '',
                    },
                ]
            })
        })().catch((error: unknown) => {
            poolPromise = null
            throw error
        })
    }
    return poolPromise
}

export async function loadClassicDaily(): Promise<ClassicDaily> {
    const { data, error } = await supabase.rpc('get_current_classic_daily')
    if (error || !isRecord(data)) throw new Error(error?.message ?? 'Could not load today')
    const dailyId = typeof data.daily_id === 'number' ? data.daily_id : Number(data.daily_id)
    const winCount = typeof data.win_count === 'number' ? data.win_count : Number(data.win_count)
    remember('daily', data, { dailyId })
    return {
        dailyId,
        endAt: typeof data.end_at === 'string' ? data.end_at : '',
        serverNow: typeof data.server_now === 'string' ? data.server_now : new Date().toISOString(),
        winCount: Number.isFinite(winCount) ? winCount : 0,
        game: getClassicGame('daily') ?? {
            guesses: [],
            status: 'in_progress',
            groupFilter: 'both',
            dailyId,
            answer: null,
        },
    }
}

export async function startClassicRound(group: ClassicGroup = 'both') {
    const { data, error } = await supabase.rpc('start_classic_round', { p_group: group })
    if (error || !isRecord(data)) throw new Error(error?.message ?? 'Could not start a round')
    remember('infinite', data, { groupFilter: group, dailyId: null })
    return getClassicGame('infinite')
}

export async function submitClassic(mode: ClassicMode, guessId: number) {
    const { data, error } = await supabase.rpc('submit_classic_guess', {
        p_difficulty: mode,
        p_guess_id: guessId,
    })
    if (error || !isRecord(data)) throw new Error(error?.message ?? 'Could not submit that guess')
    remember(mode, data)
    if (data.solved === true) noteClassicStreak(mode, data.streak as StreakRow | null)
    return {
        solved: data.solved === true,
        guesses: feedbackList(data.guesses),
        answer: answer(data.answer),
    }
}

export async function giveUpClassic(mode: ClassicMode) {
    const { data, error } = await supabase.rpc('give_up_classic', { p_difficulty: mode })
    if (error || !isRecord(data)) throw new Error(error?.message ?? 'Could not reveal the answer')
    remember(mode, data)
    noteClassicStreak(mode, data.streak as StreakRow | null)
    return answer(data.answer)
}

export function guessShareLines(guesses: ClassicFeedback[]) {
    return guesses
        .map((guess) =>
            COLUMNS.map((column) => {
                const status = guess[column].status
                if (status === 'correct') return '🟩'
                if (status === 'partial') return '🟧'
                if (status === 'higher') return '🔼'
                if (status === 'lower') return '🔽'
                return '🟥'
            }).join(''),
        )
        .join('\n')
}
