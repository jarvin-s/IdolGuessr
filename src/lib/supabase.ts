import { createBrowserClient } from '@supabase/ssr'
import {
    INFINITE_GEN_VALUES,
    isActiveInfiniteGenFilter,
} from '@/utils/genFilter'
import { supabaseAnonKey, supabaseUrl } from '@/lib/supabase/env'

export const supabase = createBrowserClient(supabaseUrl(), supabaseAnonKey())

export interface DailyImage {
    id: number
    name: string
    alt_name?: string
    group_type?: string
    play_date?: string
    img_bucket: string
    created_at?: string
    updated_at?: string
    group_name?: string
    group_category?: string
    base64_group?: string
    base64_idol?: string
    hangul_name?: string
    gen?: number
    chosen_by?: string | null
    chosen_by_url?: string | null
    zoom_x?: number | null
    zoom_y?: number | null
}

export interface HangulImage extends DailyImage {
    hangul_name: string
}

export interface CurrentDaily {
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

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketCategory = 'general' | 'bug' | 'feature' | 'improvement'

export interface FeedbackTicket {
    id: string
    ticket_number?: number | null
    category: TicketCategory
    subject: string
    status: TicketStatus
    created_at: string
    updated_at: string
    last_user_message_at: string | null
    last_admin_message_at: string | null
    token?: string
}

export interface FeedbackMessage {
    id: number
    ticket_id: string
    sender: 'user' | 'admin'
    body: string
    created_at: string
}

export interface FeedbackThread {
    ticket: FeedbackTicket
    messages: FeedbackMessage[]
}

export async function getDailyImage(): Promise<CurrentDaily | null> {
    const { data, error } = await supabase.rpc('get_current_daily')
    if (error || !data?.length) {
        console.error('get_current_daily error:', error)
        return null
    }
    return data[0] as CurrentDaily
}

const SEEN_IDOLS_KEY = 'seen-idols'
const SEEN_HANGUL_KEY = 'seen-hangul-idols'

function readSeen(key: string): string[] {
    if (typeof window === 'undefined') return []
    try {
        const parsed = JSON.parse(localStorage.getItem(key) ?? '[]') as unknown
        return Array.isArray(parsed)
            ? parsed.filter(
                  (value): value is string =>
                      typeof value === 'string' && value.length > 0
              )
            : []
    } catch {
        return []
    }
}

function rememberSeen(key: string, bucket?: string): void {
    if (!bucket || typeof window === 'undefined') return
    const seen = new Set(readSeen(key))
    if (seen.has(bucket)) return
    seen.add(bucket)
    localStorage.setItem(key, JSON.stringify([...seen]))
}

export function getSeenIdols(): string[] {
    return readSeen(SEEN_IDOLS_KEY)
}

export function addSeenIdol(bucket?: string): void {
    rememberSeen(SEEN_IDOLS_KEY, bucket)
}

export function clearSeenIdols(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(SEEN_IDOLS_KEY)
}

export function getSeenHangulIdols(): string[] {
    return readSeen(SEEN_HANGUL_KEY)
}

export function addSeenHangulIdol(bucket?: string): void {
    rememberSeen(SEEN_HANGUL_KEY, bucket)
}

export function clearSeenHangulIdols(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(SEEN_HANGUL_KEY)
}

function withoutAnswer<T extends { name?: string; alt_name?: string }>(
    rows: T[] | null
): T[] {
    return (rows ?? []).map((row) => ({
        ...row,
        name: '',
        alt_name: undefined,
    }))
}

async function fetchUnseen<T extends { img_bucket?: string }>(
    seen: string[],
    clearSeen: () => void,
    remember: (bucket?: string) => void,
    request: (
        exclude: string[] | null
    ) => Promise<{ data: T[] | null; error: { message: string } | null }>,
    label: string
): Promise<T[] | null> {
    const first = await request(seen.length > 0 ? seen : null)
    if (first.error) {
        console.error(label, first.error)
        return null
    }
    if ((first.data?.length ?? 0) > 0 || seen.length === 0) {
        first.data?.forEach((row) => remember(row.img_bucket))
        return first.data ?? []
    }
    clearSeen()
    const second = await request(null)
    if (second.error) {
        console.error(label, second.error)
        return null
    }
    second.data?.forEach((row) => remember(row.img_bucket))
    return second.data ?? []
}

export async function getMultipleRandomHangulImages(
    count: number,
    groupFilter?: 'boy-group' | 'girl-group' | null,
    bind = false
): Promise<HangulImage[]> {
    const data = await fetchUnseen<HangulImage>(
        getSeenHangulIdols(),
        clearSeenHangulIdols,
        addSeenHangulIdol,
        async (exclude) => {
            const result = await supabase.rpc('start_hangul_round', {
                p_group: groupFilter ?? null,
                p_count: count,
                p_exclude: exclude,
                p_bind: bind,
            })
            return {
                data: result.data as HangulImage[] | null,
                error: result.error,
            }
        },
        '[Hangul DB Request] Error:'
    )
    if (!data) return []
    const rows = withoutAnswer(data).filter((img) => {
        if (!img.hangul_name) return false
        if (!bind && groupFilter && img.group_category !== groupFilter)
            return false
        return true
    })
    return bind ? rows : rows.slice(0, count)
}

export async function getMultipleRandomUnlimitedImages(
    count: number,
    groupFilter?: 'boy-group' | 'girl-group' | null,
    genFilter?: number[],
    options?: { difficulty?: string; imageMode?: string; bind?: boolean }
): Promise<DailyImage[]> {
    const isFilteringByGen = isActiveInfiniteGenFilter(genFilter)
    const bind = options?.bind ?? false
    const data = await fetchUnseen<DailyImage>(
        getSeenIdols(),
        clearSeenIdols,
        addSeenIdol,
        async (exclude) => {
            const result = await supabase.rpc('start_infinite_round', {
                p_difficulty: options?.difficulty || 'normal',
                p_image_mode: options?.imageMode || 'pixelated',
                p_group: groupFilter ?? null,
                p_gens: isFilteringByGen ? genFilter : null,
                p_count: count,
                p_exclude: exclude,
                p_bind: bind,
            })
            return {
                data: result.data as DailyImage[] | null,
                error: result.error,
            }
        },
        '[DB Request] Error:'
    )
    if (!data) return []
    const rows = withoutAnswer(data).filter((img) => {
        if (!img.group_category || !img.base64_group) return false
        if (!bind && groupFilter && img.group_category !== groupFilter)
            return false
        return true
    })
    return bind ? rows : rows.slice(0, count)
}

function parseJson(value: unknown): unknown {
    if (typeof value !== 'string') return value
    try {
        return JSON.parse(value)
    } catch {
        return null
    }
}

export async function claimFeedbackTickets(
    tickets: { id: string; token: string }[]
): Promise<string[]> {
    if (tickets.length === 0) return []
    const { data, error } = await supabase.rpc('claim_feedback_tickets', {
        p_tickets: tickets,
    })
    if (error) throw error
    const rows = parseJson(data)
    return Array.isArray(rows)
        ? rows.filter((id): id is string => typeof id === 'string')
        : []
}

export async function createFeedbackTicket(
    category: TicketCategory,
    message: string
): Promise<{ id: string; access_token: string }> {
    const { data, error } = await supabase.rpc('create_feedback_ticket', {
        p_category: category,
        p_message: message,
    })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    if (!row) throw new Error('Ticket was not created')
    return row
}

export async function getMyFeedbackTickets(
    tickets: { id: string; token: string }[]
): Promise<FeedbackTicket[]> {
    const byId = new Map<string, FeedbackTicket>()
    const { data: listed, error: listError } = await supabase.rpc(
        'list_my_feedback_tickets'
    )
    const listedRows = parseJson(listed)
    if (!listError && Array.isArray(listedRows)) {
        for (const row of listedRows as FeedbackTicket[]) byId.set(row.id, row)
    }
    const missing = tickets.filter((ticket) => !byId.has(ticket.id))
    if (missing.length > 0) {
        const { data, error } = await supabase.rpc('get_my_feedback_tickets', {
            p_tickets: missing,
        })
        if (error && byId.size === 0) throw error
        for (const row of (data ?? []) as FeedbackTicket[]) {
            if (!byId.has(row.id)) byId.set(row.id, row)
        }
    } else if (listError && tickets.length === 0) {
        throw listError
    }
    return [...byId.values()]
}

export async function markFeedbackRead(
    ticketId: string,
    seenAt: string | null
): Promise<void> {
    if (!seenAt) return
    const { error } = await supabase.rpc('mark_feedback_read', {
        p_ticket_id: ticketId,
        p_seen_at: seenAt,
    })
    if (error) console.error('mark_feedback_read', error)
}

export async function getFeedbackThread(
    ticketId: string,
    token: string
): Promise<FeedbackThread> {
    const { data, error } = await supabase.rpc('get_feedback_thread', {
        p_ticket_id: ticketId,
        p_token: token,
    })
    if (error) throw error
    return data as FeedbackThread
}

export async function addFeedbackMessage(
    ticketId: string,
    token: string,
    body: string
): Promise<void> {
    const { error } = await supabase.rpc('add_feedback_message', {
        p_ticket_id: ticketId,
        p_token: token,
        p_body: body,
    })
    if (error) throw error
}

export async function signInAdmin(
    email: string,
    password: string
): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })
    if (error) throw error
}

export async function signOutAdmin(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

export async function checkIsAdmin(): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_admin')
    if (error) throw error
    return data === true
}

export async function adminListTickets(
    status?: TicketStatus | 'all'
): Promise<FeedbackTicket[]> {
    let query = supabase
        .from('feedback_tickets')
        .select(
            'id, category, subject, status, created_at, updated_at, last_user_message_at, last_admin_message_at'
        )
        .order('updated_at', { ascending: false })
    if (status && status !== 'all') query = query.eq('status', status)
    const { data, error } = await query
    if (error) throw error
    return (data ?? []) as FeedbackTicket[]
}

export async function adminGetThread(
    ticketId: string
): Promise<FeedbackThread> {
    const [ticketRes, messagesRes] = await Promise.all([
        supabase
            .from('feedback_tickets')
            .select(
                'id, category, subject, status, created_at, updated_at, last_user_message_at, last_admin_message_at'
            )
            .eq('id', ticketId)
            .single(),
        supabase
            .from('feedback_messages')
            .select('id, ticket_id, sender, body, created_at')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true }),
    ])
    if (ticketRes.error) throw ticketRes.error
    if (messagesRes.error) throw messagesRes.error
    return {
        ticket: ticketRes.data as FeedbackTicket,
        messages: (messagesRes.data ?? []) as FeedbackMessage[],
    }
}

export async function adminReply(
    ticketId: string,
    body: string
): Promise<void> {
    const { error } = await supabase.from('feedback_messages').insert({
        ticket_id: ticketId,
        sender: 'admin',
        body,
    })
    if (error) throw error
}

export async function adminSetStatus(
    ticketId: string,
    status: TicketStatus
): Promise<void> {
    const { error } = await supabase
        .from('feedback_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', ticketId)
    if (error) throw error
}

export interface Announcement {
    id: string
    message: string
    display_seconds: number | null
    is_active: boolean
    created_at: string
    updated_at: string
}

const announcementColumns =
    'id, message, display_seconds, is_active, created_at, updated_at'

export async function getActiveAnnouncement(): Promise<Announcement | null> {
    const { data, error } = await supabase
        .from('announcements')
        .select(announcementColumns)
        .eq('is_active', true)
        .maybeSingle()
    if (error) throw error
    return (data as Announcement | null) ?? null
}

export async function adminListAnnouncements(): Promise<Announcement[]> {
    const { data, error } = await supabase
        .from('announcements')
        .select(announcementColumns)
        .order('created_at', { ascending: false })
        .limit(10)
    if (error) throw error
    return (data ?? []) as Announcement[]
}

export async function adminPublishAnnouncement(
    message: string,
    displaySeconds: number | null
): Promise<void> {
    const trimmed = message.trim()
    if (!trimmed) throw new Error('Message is empty')
    const { error } = await supabase.from('announcements').insert({
        message: trimmed,
        display_seconds: displaySeconds,
        is_active: true,
    })
    if (error) throw error
}

export async function adminActivateAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
        .from('announcements')
        .update({ is_active: true })
        .eq('id', id)
    if (error) throw error
}

export async function adminClearAnnouncement(): Promise<void> {
    const { error } = await supabase
        .from('announcements')
        .update({ is_active: false })
        .eq('is_active', true)
    if (error) throw error
}

function publicImageUrl(objectPath: string): string {
    const normalizedUrl = supabaseUrl().replace(/\/+$/, '')
    return `${normalizedUrl}/storage/v1/object/public/${objectPath}`
}

export function getImageUrl(
    groupType: string,
    imgBucket: string,
    guessNumber: number | 'clear',
    mode: 'daily' | 'unlimited' = 'daily',
    groupCategory?: string,
    base64Group?: string
): string {
    const fileName =
        guessNumber === 'clear' ? 'clear.png' : `00${guessNumber}.png`

    if (mode === 'unlimited') {
        if (!groupCategory || !base64Group || !imgBucket) {
            if (process.env.NODE_ENV !== 'production') {
                console.warn(
                    '[getImageUrl] Missing required fields for unlimited mode:',
                    {
                        groupCategory,
                        base64Group,
                        imgBucket,
                        groupType,
                    }
                )
            }
            return ''
        }
        return publicImageUrl(
            `images/unlimited/${groupCategory}/${base64Group}/${imgBucket}/${fileName}`
        )
    }

    return publicImageUrl(
        `images/${mode}/${groupType}/${imgBucket}/${fileName}`
    )
}

export function getHangulImageUrl(
    groupCategory: string,
    base64Group: string,
    imgBucket: string,
    imageType: 'hint' | 'clear' = 'clear'
): string {
    if (!groupCategory || !base64Group || !imgBucket) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn('[getHangulImageUrl] Missing required fields:', {
                groupCategory,
                base64Group,
                imgBucket,
            })
        }
        return ''
    }

    const fileName = imageType === 'hint' ? 'hint.png' : 'clear.png'
    return publicImageUrl(
        `images/hangul/${groupCategory}/${base64Group}/${imgBucket}/${fileName}`
    )
}

export interface GuessTrackingData {
    session_id: string
    image_id: number
    guesses: string[]
    guess_text: string // Keep for backwards compatibility with existing DB column
    is_correct: boolean
    guess_number: number
    guess_time: string
    time_since_previous_guess: number | null // Keep for backwards compatibility
    user_agent: string | null
    device_type: string | null
    browser: string | null
}

export interface UnlimitedGameData {
    session_id: string
    streak: number
    difficulty: 'easy' | 'normal' | 'hard' | 'challenger'
    mode: 'pixelated' | 'zoom'
}

export interface HangulGameData {
    session_id: string
    streak: number
}

let accountId: string | null = null

export function setAccountId(id: string | null) {
    accountId = id
}

export function getAccountId() {
    return accountId
}

export function getOrCreateSessionId(): string {
    if (accountId) return accountId
    if (typeof window === 'undefined') return ''

    let sessionId = sessionStorage.getItem('idol-guessr-session-id')
    if (!sessionId) {
        sessionId =
            typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
                      /[xy]/g,
                      (c) => {
                          const r = (Math.random() * 16) | 0
                          const v = c === 'x' ? r : (r & 0x3) | 0x8
                          return v.toString(16)
                      }
                  )
        sessionStorage.setItem('idol-guessr-session-id', sessionId)
    }
    return sessionId
}

export async function trackDailyGameEnd(): Promise<void> {
    // submit_daily_guess already stores the finished game on the account.
}

// Keep for backwards compatibility during transition
export function resetGuessTimer(): void {
    // No longer needed but kept to avoid breaking imports
}

export async function trackUnlimitedGame(
    streak: number,
    difficulty: UnlimitedGameData['difficulty'] = 'normal',
    mode: UnlimitedGameData['mode'] = 'pixelated'
): Promise<void> {
    if (streak < 1) return
    const userId = getAccountId()
    if (!userId) return

    try {
        const gameData: UnlimitedGameData & { user_id: string } = {
            session_id: userId,
            streak: streak,
            difficulty,
            mode,
            user_id: userId,
        }

        const { error } = await supabase
            .from('unlimited_game_tracking')
            .insert(gameData)

        if (error) {
            console.error('Error tracking unlimited game:', error)
        }
    } catch (error) {
        console.error('Error tracking unlimited game:', error)
    }
}

export async function trackHangulGame(streak: number): Promise<void> {
    if (streak < 1) return
    const userId = getAccountId()
    if (!userId) return

    try {
        const gameData: HangulGameData & { user_id: string } = {
            session_id: userId,
            streak: streak,
            user_id: userId,
        }

        const { error } = await supabase
            .from('hangul_game_tracking')
            .insert(gameData)

        if (error) {
            console.error('Error tracking hangul game:', error)
        }
    } catch (error) {
        console.error('Error tracking hangul game:', error)
    }
}

export async function getDailyCount(): Promise<number> {
    const now = new Date()
    const gmtPlus1 = new Date(now.getTime() + 60 * 60 * 1000)
    const today = gmtPlus1.toISOString().split('T')[0]

    const { count, error } = await supabase
        .from('dailies_public')
        .select('id', { count: 'exact', head: true })
        .lte('play_date', today)

    if (error) {
        console.error('Error getting daily count:', error)
        return 0
    }
    return (count || 0) + 1
}

export async function getTodayDailyGuessCount(): Promise<number> {
    const { data, error } = await supabase.rpc('get_today_daily_win_count')
    if (error) {
        console.error('Error getting today daily guess count:', error)
        return 0
    }
    return data ?? 0
}

export interface HistoryDailyImage extends DailyImage {
    play_date: string
}

export async function getDailyImageByDate(
    date: string
): Promise<HistoryDailyImage | null> {
    const startOfDay = `${date}T00:00:00`
    const endOfDay = `${date}T23:59:59`

    const { data, error } = await supabase
        .from('dailies_public')
        .select(
            'id, group_type, play_date, img_bucket, group_name, chosen_by, chosen_by_url'
        )
        .gte('play_date', startOfDay)
        .lte('play_date', endOfDay)
        .maybeSingle()

    if (error || !data) {
        return null
    }

    return { ...data, name: '' } as HistoryDailyImage
}

export async function getAvailableDailyDates(): Promise<{
    dates: string[]
    firstDate: string | null
    lastDate: string | null
}> {
    const now = new Date()
    const gmtPlus1 = new Date(now.getTime() + 60 * 60 * 1000)
    const today = gmtPlus1.toISOString().split('T')[0]
    const endOfToday = `${today}T23:59:59`

    const { data, error } = await supabase
        .from('dailies_public')
        .select('play_date')
        .lte('play_date', endOfToday)
        .order('play_date', { ascending: true })

    if (error) {
        return { dates: [], firstDate: null, lastDate: null }
    }

    const dates =
        data?.map((d) => {
            const playDate = new Date(d.play_date)
            const year = playDate.getFullYear()
            const month = String(playDate.getMonth() + 1).padStart(2, '0')
            const day = String(playDate.getDate()).padStart(2, '0')
            return `${year}-${month}-${day}`
        }) || []

    return {
        dates,
        firstDate: dates.length > 0 ? dates[0] : null,
        lastDate: dates.length > 0 ? dates[dates.length - 1] : null,
    }
}

// ============================================
// Challenge Mode Types and Functions
// ============================================

export interface ChallengeIdol {
    id: number
    name: string
    alt_name?: string
    img_bucket: string
    group_category: string
    base64_group: string
    group_name?: string
}

export interface Challenge {
    id: string
    idol_count: number
    group_filter: string
    gen_filter: number[] | null
    created_at: string
    expires_at: string
    idols: ChallengeIdol[]
}

export interface ChallengeIdolResult {
    idol_id: number
    correct: boolean
    guess_count: number
    guesses: string[]
}

export interface ChallengeResult {
    session_id: string
    nickname: string | null
    results: ChallengeIdolResult[]
    total_correct: number
    completed_at: string
}

export async function createChallenge(
    sessionId: string,
    idolCount: number,
    groupFilter: 'boy-group' | 'girl-group' | 'both' = 'both',
    genFilter?: number[] | null
): Promise<string | null> {
    const includesAllGens =
        !genFilter ||
        INFINITE_GEN_VALUES.every((gen) => genFilter.includes(gen))

    try {
        const { data, error } = await supabase.rpc('create_challenge', {
            p_session_id: sessionId,
            p_idol_count: idolCount,
            p_group_filter: groupFilter,
            p_gen_filter: includesAllGens ? null : genFilter,
        })

        if (error) {
            if (error.message.includes('not_enough_idols')) {
                throw new Error('not_enough_idols')
            }
            console.error('Error creating challenge:', error)
            return null
        }

        return data as string
    } catch (error) {
        if (error instanceof Error && error.message === 'not_enough_idols')
            throw error
        console.error('Error creating challenge:', error)
        return null
    }
}

export async function getChallenge(
    challengeId: string
): Promise<Challenge | null> {
    try {
        const { data, error } = await supabase.rpc('get_challenge', {
            p_challenge_id: challengeId,
        })

        if (error) {
            console.error('Error getting challenge:', error)
            return null
        }

        if (!data || data.length === 0) {
            return null
        }

        const row = data[0]
        return {
            id: row.id,
            idol_count: row.idol_count,
            group_filter: row.group_filter,
            gen_filter: row.gen_filter ?? null,
            created_at: row.created_at,
            expires_at: row.expires_at,
            idols: row.idols || [],
        }
    } catch (error) {
        console.error('Error getting challenge:', error)
        return null
    }
}

export async function submitChallengeResult(
    challengeId: string,
    sessionId: string,
    nickname: string | null,
    results: ChallengeIdolResult[],
    totalCorrect: number
): Promise<string | null> {
    try {
        const { data, error } = await supabase.rpc('submit_challenge_result', {
            p_challenge_id: challengeId,
            p_session_id: sessionId,
            p_nickname: nickname,
            p_results: results,
            p_total_correct: totalCorrect,
        })

        if (error) {
            console.error('Error submitting challenge result:', error)
            return null
        }

        return data as string
    } catch (error) {
        console.error('Error submitting challenge result:', error)
        return null
    }
}

export async function getChallengeResults(
    challengeId: string
): Promise<ChallengeResult[]> {
    try {
        const { data, error } = await supabase.rpc('get_challenge_results', {
            p_challenge_id: challengeId,
        })

        if (error) {
            console.error('Error getting challenge results:', error)
            return []
        }

        return (data || []).map(
            (row: {
                session_id: string
                nickname: string | null
                results: ChallengeIdolResult[]
                total_correct: number
                completed_at: string
            }) => ({
                session_id: row.session_id,
                nickname: row.nickname,
                results: row.results,
                total_correct: row.total_correct,
                completed_at: row.completed_at,
            })
        )
    } catch (error) {
        console.error('Error getting challenge results:', error)
        return []
    }
}

export async function startChallengeAttempt(
    challengeId: string
): Promise<boolean> {
    const { error } = await supabase.rpc('start_challenge_attempt', {
        p_challenge_id: challengeId,
    })
    if (error) {
        console.error('start_challenge_attempt', error)
        return false
    }
    return true
}

export async function checkChallengePlayed(
    challengeId: string,
    sessionId: string
): Promise<boolean> {
    try {
        const { data, error } = await supabase
            .from('challenge_results')
            .select('id')
            .eq('challenge_id', challengeId)
            .eq('session_id', sessionId)
            .maybeSingle()

        if (error) {
            console.error('Error checking if challenge played:', error)
            return false
        }

        return data !== null
    } catch (error) {
        console.error('Error checking if challenge played:', error)
        return false
    }
}
