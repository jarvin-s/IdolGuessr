'use client'

import {
    getMultipleRandomHangulImages,
    getMultipleRandomUnlimitedImages,
    supabase,
    type DailyImage,
    type HangulImage,
} from '@/lib/supabase'
import { encodeIdolName } from '@/utils/encoding'
import type { ImageMode, InfiniteDifficulty } from '@/utils/difficulty'
import type {
    DailyCompletion,
    DailyProgress,
    HangulGameState,
    HangulStats,
    UnlimitedGameState,
    UnlimitedStats,
    UserStats,
} from '@/components/stats/UserStats'

export interface StreakRow {
    mode: string
    difficulty: string
    image_mode: string
    current_streak: number
    max_streak: number
    total_games: number
    total_wins: number
    guess_distribution: Record<string, number>
    last_played_on: string | null
    imported_max_streak: number
    leaderboard_eligible: boolean
}

export interface PlayerProfile {
    id: string
    nickname: string | null
    avatar_url: string | null
    is_anonymous: boolean
    input_mode: 'keyboard' | 'text'
    theme: 'light' | 'dark' | 'system'
    difficulty: InfiniteDifficulty
    image_mode: ImageMode
    group_filter: 'boy-group' | 'girl-group' | 'both'
    gen_filter: number[]
    hangul_group_filter: 'boy-group' | 'girl-group' | 'both'
    game_mode: 'daily' | 'unlimited' | 'hangul'
    seen_notices: Record<string, unknown>
    nickname_changed_at: string | null
    legacy_imported_at: string | null
    created_at: string
}

interface ActiveGame {
    mode: string
    difficulty: string
    image_mode: string
    guesses: Array<'correct' | 'incorrect' | 'empty'>
    guess_text: string[]
    hints_remaining: number | null
    skips_remaining: number | null
    last_outcome: string | null
    queue?: Array<{
        id?: number
        name?: string
        hangul_name?: string
        group_type?: string
        img_bucket?: string
        group_category?: string
        base64_group?: string
        base64_idol?: string
        group_name?: string
        zoom_x?: number | null
        zoom_y?: number | null
    }>
    queue_index?: number
    idol: {
        id?: number
        name?: string
        hangul_name?: string
        group_type?: string
        img_bucket?: string
        group_category?: string
        base64_group?: string
        base64_idol?: string
        group_name?: string
        gen?: number
        zoom_x?: number | null
        zoom_y?: number | null
    } | null
}

interface DailyOverview {
    daily_id: number
    guesses: string[] | null
    status: 'in_progress' | 'won' | 'lost' | null
    guess_count: number | null
    absent_letters: string[] | null
    answer: string | null
}

interface Overview {
    profile: PlayerProfile
    streaks: StreakRow[]
    daily: DailyOverview | null
    active_games: ActiveGame[]
}

export interface GuessVerdict {
    correct: boolean
    status: 'in_progress' | 'won' | 'lost'
    answer: string | null
    absentLetters: string[]
    guessCount: number
    guesses: string[]
    promptGuest: boolean
    streak: StreakRow | null
}

const listeners = new Set<() => void>()
let overview: Overview | null = null
let ready = false
let userId: string | null = null

function emit() {
    listeners.forEach((listener) => listener())
}

export function subscribePlayer(listener: () => void) {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export function playerReady() {
    return ready
}

export function playerUserId() {
    return userId
}

export function getProfile(): PlayerProfile | null {
    return overview?.profile ?? null
}

export function getStreaks(): StreakRow[] {
    return overview?.streaks ?? []
}

function findStreak(mode: string, difficulty = '', imageMode = '') {
    return (
        overview?.streaks.find(
            (row) =>
                row.mode === mode &&
                row.difficulty === difficulty &&
                row.image_mode === imageMode,
        ) ?? null
    )
}

function distribution(row: StreakRow | null): UserStats['guessDistribution'] {
    const source = row?.guess_distribution ?? {}
    return {
        1: Number(source['1'] ?? 0),
        2: Number(source['2'] ?? 0),
        3: Number(source['3'] ?? 0),
        4: Number(source['4'] ?? 0),
        5: Number(source['5'] ?? 0),
        6: Number(source['6'] ?? 0),
    }
}

export function getDailyStats(): UserStats {
    const row = findStreak('daily')
    const daily = overview?.daily
    const finished = daily?.status === 'won' || daily?.status === 'lost'
    const today = new Date().toDateString()
    const completions: UserStats['dailyCompletions'] = {}
    if (finished && daily) {
        const completion: DailyCompletion = {
            date: today,
            imageId: daily.daily_id,
            completed: true,
            won: daily.status === 'won',
            guessCount: daily.status === 'won' ? daily.guess_count ?? 0 : 0,
            correctAnswer: (daily.answer ?? '').toUpperCase(),
            guessAttempts: daily.guesses ?? [],
        }
        completions[today] = completion
    }
    return {
        totalGames: row?.total_games ?? 0,
        totalWins: row?.total_wins ?? 0,
        currentStreak: row?.current_streak ?? 0,
        maxStreak: row?.max_streak ?? 0,
        guessDistribution: distribution(row),
        lastPlayedDate: row?.last_played_on ? new Date(row.last_played_on).toDateString() : '',
        todayCompleted: finished,
        dailyCompletions: completions,
    }
}

export function getUnlimitedStats(difficulty: InfiniteDifficulty, mode: ImageMode): UnlimitedStats {
    const row = findStreak('infinite', difficulty, mode)
    return {
        totalGames: row?.total_games ?? 0,
        totalWins: row?.total_wins ?? 0,
        currentStreak: row?.current_streak ?? 0,
        maxStreak: row?.max_streak ?? 0,
    }
}

export function getHangulStats(): HangulStats {
    const row = findStreak('hangul')
    return {
        totalGames: row?.total_games ?? 0,
        totalWins: row?.total_wins ?? 0,
        currentStreak: row?.current_streak ?? 0,
        maxStreak: row?.max_streak ?? 0,
    }
}

export function getDailyProgress(): DailyProgress | null {
    const daily = overview?.daily
    if (!daily?.guesses?.length || daily.status === 'won' || daily.status === 'lost') return null
    const guesses: DailyProgress['guesses'] = ['empty', 'empty', 'empty', 'empty', 'empty', 'empty']
    daily.guesses.forEach((_, index) => {
        if (index < 6) guesses[index] = 'incorrect'
    })
    return {
        date: new Date().toDateString(),
        imageId: daily.daily_id,
        guesses,
    }
}

export function getDailyAttempts(): string[] {
    return overview?.daily?.guesses ?? []
}

export function getDailyAbsentLetters(): string[] {
    return overview?.daily?.absent_letters ?? []
}

function padGuesses(raw: unknown, count: number): Array<'correct' | 'incorrect' | 'empty'> {
    const list = Array.isArray(raw) ? raw : []
    return Array.from({ length: count }, (_, index) => {
        const value = list[index]
        return value === 'correct' || value === 'incorrect' ? value : 'empty'
    })
}

function playableIdol(idol: ActiveGame['idol'] | undefined) {
    return Boolean(idol && (idol.img_bucket || idol.hangul_name))
}

function issuedResume(game: ActiveGame): { idol: NonNullable<ActiveGame['idol']>; cursor: number } | null {
    if (game.last_outcome === 'lost') return null
    const queue = game.queue ?? []
    let cursor = game.queue_index ?? 0
    let idol = playableIdol(game.idol) ? game.idol : null
    if (!idol && playableIdol(queue[cursor]) && game.last_outcome !== 'won' && game.last_outcome !== 'lost') {
        idol = queue[cursor]
    }
    if (!idol && game.last_outcome === 'won' && playableIdol(queue[cursor + 1])) {
        cursor += 1
        idol = queue[cursor] ?? null
    }
    if (!idol || !playableIdol(idol)) return null
    return { idol, cursor }
}

export function getUnlimitedGame(difficulty: InfiniteDifficulty, mode: ImageMode): UnlimitedGameState | null {
    const game = overview?.active_games.find(
        (row) => row.mode === 'infinite' && row.difficulty === difficulty && row.image_mode === mode,
    )
    if (!game) return null
    const resumed = issuedResume(game)
    if (!resumed?.idol.group_category || !resumed.idol.base64_group) return null
    const idol = resumed.idol
    const queue = game.queue ?? []
    const max = difficulty === 'challenger' ? 3 : 6
    return {
        groupType: idol.group_type ?? '',
        imgBucket: idol.img_bucket ?? '',
        groupCategory: idol.group_category,
        base64Group: idol.base64_group,
        base64Idol: idol.base64_idol,
        encodedIdolName: encodeIdolName('\u200b'),
        groupName: idol.group_name,
        zoomX: idol.zoom_x,
        zoomY: idol.zoom_y,
        difficulty,
        hintsRemaining: game.hints_remaining ?? undefined,
        skipsRemaining: game.skips_remaining ?? undefined,
        guesses: padGuesses(game.guesses, max),
        savedAt: new Date().toISOString(),
        currentImageIndex: queue.length > 0 ? resumed.cursor + 1 : undefined,
        prefetchedImages: queue.length
            ? queue.map((row) => ({
                  id: row.id ?? 0,
                  name: row.name ?? '',
                  group_type: row.group_type ?? '',
                  img_bucket: row.img_bucket ?? '',
                  group_category: row.group_category,
                  base64_group: row.base64_group,
                  base64_idol: row.base64_idol,
                  group_name: row.group_name,
                  zoom_x: row.zoom_x,
                  zoom_y: row.zoom_y,
              }))
            : undefined,
    }
}

export function getHangulGame(): HangulGameState | null {
    const game = overview?.active_games.find((row) => row.mode === 'hangul')
    if (!game) return null
    const resumed = issuedResume(game)
    if (!resumed?.idol.hangul_name) return null
    const idol = resumed.idol
    const queue = game.queue ?? []
    return {
        groupType: idol.group_type ?? '',
        imgBucket: idol.img_bucket ?? '',
        idolId: idol.id,
        groupCategory: idol.group_category,
        base64Group: idol.base64_group,
        base64Idol: idol.base64_idol,
        encodedIdolName: encodeIdolName('\u200b'),
        hangulName: resumed.idol.hangul_name,
        groupName: idol.group_name,
        skipsRemaining: game.skips_remaining ?? undefined,
        guesses: padGuesses(game.guesses, 6),
        savedAt: new Date().toISOString(),
        currentImageIndex: queue.length > 0 ? resumed.cursor + 1 : undefined,
        prefetchedImages: queue.length
            ? queue.map((row) => ({
                  id: row.id ?? 0,
                  name: row.name ?? '',
                  alt_name: undefined,
                  hangul_name: row.hangul_name ?? '',
                  group_type: row.group_type ?? '',
                  img_bucket: row.img_bucket ?? '',
                  group_category: row.group_category,
                  base64_group: row.base64_group,
                  base64_idol: row.base64_idol,
                  group_name: row.group_name,
              }))
            : undefined,
    }
}

function applyStreak(streak: StreakRow | null) {
    if (!overview || !streak) return
    const index = overview.streaks.findIndex(
        (row) =>
            row.mode === streak.mode &&
            row.difficulty === streak.difficulty &&
            row.image_mode === streak.image_mode,
    )
    if (index >= 0) overview.streaks[index] = { ...overview.streaks[index], ...streak }
    else overview.streaks.push(streak)
}

function mapVerdict(data: Record<string, unknown>, mode: string, difficulty: string, imageMode: string): GuessVerdict {
    const streakRaw = data.streak as StreakRow | null
    const streak = streakRaw
        ? { ...streakRaw, mode, difficulty, image_mode: imageMode }
        : null
    applyStreak(streak)
    const absent = Array.isArray(data.absent_letters) ? (data.absent_letters as string[]) : []
    const guesses = Array.isArray(data.guesses) ? (data.guesses as string[]) : []
    return {
        correct: Boolean(data.correct),
        status: (data.status as GuessVerdict['status']) ?? 'in_progress',
        answer: typeof data.answer === 'string' && data.answer ? data.answer : null,
        absentLetters: absent,
        guessCount: Number(data.guess_count ?? guesses.length ?? 0),
        guesses,
        promptGuest: Boolean(data.prompt_guest),
        streak,
    }
}

export async function refreshOverview() {
    const { data, error } = await supabase.rpc('get_my_overview')
    if (error) throw error
    overview = data as Overview
    applySettingsLocally(pendingSettings)
    ready = true
    const { data: userData } = await supabase.auth.getUser()
    userId = userData.user?.id ?? overview?.profile?.id ?? null
    emit()
    if (Object.keys(unverifiedSettings).length > 0) scheduleSettingsFlush()
    return overview
}

export async function judgeDailyGuess(guess: string, dailyId?: number): Promise<GuessVerdict | null> {
    const { data, error } = await supabase.rpc('submit_daily_guess', {
        p_guess: guess,
        p_daily_id: dailyId ?? null,
    })
    if (error || !data) {
        console.error('submit_daily_guess', error)
        return null
    }
    const verdict = mapVerdict(data as Record<string, unknown>, 'daily', '', '')
    if (overview?.daily) {
        overview.daily = {
            ...overview.daily,
            guesses: verdict.guesses,
            status: verdict.status,
            guess_count: verdict.guessCount,
            absent_letters: Array.from(new Set([...(overview.daily.absent_letters ?? []), ...verdict.absentLetters])),
            answer: verdict.answer ?? overview.daily.answer,
        }
    }
    if (verdict.promptGuest) window.dispatchEvent(new Event('idol-guessr-guest-prompt'))
    emit()
    return verdict
}

const focusedIssued = new Map<string, string>()

function focusSlot(pool: string, difficulty: string, imageMode: string) {
    return `${pool}\0${difficulty}\0${imageMode}`
}

function endedRunKey(mode: 'infinite' | 'hangul', difficulty = '', imageMode = '') {
    return mode === 'hangul'
        ? 'idol-guessr-ended:hangul'
        : `idol-guessr-ended:infinite:${difficulty}:${imageMode}`
}

export function markRunEnded(
    mode: 'infinite' | 'hangul',
    difficulty = '',
    imageMode = '',
    streak = 0,
) {
    if (typeof window === 'undefined') return
    const ended = Math.max(0, Math.floor(streak))
    window.localStorage.setItem(endedRunKey(mode, difficulty, imageMode), `s:${ended}`)
}

export function clearRunEnded(mode: 'infinite' | 'hangul', difficulty = '', imageMode = '') {
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(endedRunKey(mode, difficulty, imageMode))
}

export function endedRunStreak(mode: 'infinite' | 'hangul', difficulty = '', imageMode = '') {
    if (typeof window === 'undefined') return 0
    const raw = window.localStorage.getItem(endedRunKey(mode, difficulty, imageMode))
    if (!raw?.startsWith('s:')) return 0
    const value = Number(raw.slice(2))
    return Number.isFinite(value) ? value : 0
}

function runEndedLocally(mode: 'infinite' | 'hangul', difficulty = '', imageMode = '') {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem(endedRunKey(mode, difficulty, imageMode)) != null
}

export function runAwaitingPlayAgain(
    mode: 'infinite' | 'hangul',
    difficulty = '',
    imageMode = '',
) {
    if (runEndedLocally(mode, difficulty, imageMode)) return true
    if (mode === 'hangul') {
        return overview?.active_games.find((row) => row.mode === 'hangul')?.last_outcome === 'lost'
    }
    return (
        overview?.active_games.find(
            (row) =>
                row.mode === 'infinite' &&
                row.difficulty === difficulty &&
                row.image_mode === imageMode,
        )?.last_outcome === 'lost'
    )
}

export async function focusIssuedIdol(
    pool: 'unlimited' | 'hangul',
    imgBucket: string,
    difficulty = '',
    imageMode = '',
) {
    if (!imgBucket) return false
    const mode = pool === 'hangul' ? 'hangul' : 'infinite'
    if (runEndedLocally(mode, difficulty, imageMode)) return false
    const slot = focusSlot(pool, difficulty, imageMode)
    if (focusedIssued.get(slot) === imgBucket) return true
    focusedIssued.set(slot, imgBucket)
    const { error } = await supabase.rpc('focus_issued_idol', {
        p_pool: pool,
        p_img_bucket: imgBucket,
        p_difficulty: difficulty,
        p_image_mode: imageMode,
    })
    if (!error) return true
    if (focusedIssued.get(slot) === imgBucket) focusedIssued.delete(slot)
    const message = String(error.message)
    if (!message.includes('round_in_progress') && !message.includes('round_finished')) {
        console.error('focus_issued_idol', error)
    }
    return false
}

let roundGuessActive = false

export async function judgeRoundGuess(input: {
    pool: 'unlimited' | 'hangul'
    guess: string
    imgBucket?: string
    idolId?: number
    difficulty?: string
    imageMode?: string
}): Promise<GuessVerdict | null> {
    const modeForStreak = input.pool === 'hangul' ? 'hangul' : 'infinite'
    const difficultyForStreak = input.pool === 'hangul' ? '' : input.difficulty ?? 'normal'
    const imageModeForStreak = input.pool === 'hangul' ? '' : input.imageMode ?? 'pixelated'
    if (roundGuessActive) return null
    roundGuessActive = true
    try {
        const streakBefore = findStreak(modeForStreak, difficultyForStreak, imageModeForStreak)?.current_streak ?? 0
        const focusKey = input.imgBucket || (input.idolId && input.idolId > 0 ? String(input.idolId) : '')
        if (focusKey) {
            const focused = await focusIssuedIdol(input.pool, focusKey, input.difficulty, input.imageMode)
            if (!focused) return null
        }
        const { data, error } =
            input.pool === 'hangul'
                ? await supabase.rpc('submit_hangul_guess', { p_guess: input.guess })
                : await supabase.rpc('submit_infinite_guess', {
                      p_guess: input.guess,
                      p_difficulty: input.difficulty ?? 'normal',
                      p_image_mode: input.imageMode ?? 'pixelated',
                  })
        if (error || !data) {
            console.error('submit_round_guess', error)
            return null
        }
        const mode = input.pool === 'hangul' ? 'hangul' : 'infinite'
        const difficulty = input.pool === 'hangul' ? '' : input.difficulty ?? 'normal'
        const imageMode = input.pool === 'hangul' ? '' : input.imageMode ?? 'pixelated'
        const verdict = mapVerdict(data as Record<string, unknown>, mode, difficulty, imageMode)
        if (verdict.status === 'lost') {
            markRunEnded(mode, difficulty, imageMode, streakBefore)
        }
        if (verdict.status === 'won' || verdict.status === 'lost') {
            await releaseRound(input.pool, difficulty, imageMode)
        }
        if (verdict.promptGuest) window.dispatchEvent(new Event('idol-guessr-guest-prompt'))
        emit()
        return verdict
    } finally {
        roundGuessActive = false
    }
}

export async function consumeRoundSkip(pool: 'unlimited' | 'hangul', difficulty = '', imageMode = '') {
    const { data, error } = await supabase.rpc(
        pool === 'hangul' ? 'skip_hangul_round' : 'skip_infinite_round',
        pool === 'hangul' ? {} : { p_difficulty: difficulty, p_image_mode: imageMode },
    )
    if (error) {
        console.error('skip round', error)
        return null
    }
    return Number((data as { skips_remaining?: number })?.skips_remaining ?? 0)
}

export async function consumeRoundHint(pool: 'unlimited' | 'hangul', difficulty = '', imageMode = '') {
    const { data, error } = await supabase.rpc('consume_round_hint', {
        p_pool: pool,
        p_difficulty: difficulty,
        p_image_mode: imageMode,
    })
    if (error) {
        console.error('hint', error)
        return null
    }
    return Number((data as { hints_remaining?: number })?.hints_remaining ?? 0)
}

export async function releaseRound(pool: 'unlimited' | 'hangul', difficulty = '', imageMode = '') {
    focusedIssued.delete(focusSlot(pool, difficulty, imageMode))
    await supabase.rpc('release_round', {
        p_pool: pool,
        p_difficulty: difficulty,
        p_image_mode: imageMode,
    })
}

type SettingsPatch = Record<string, unknown>

const SETTINGS_FLUSH_MS = 150
let pendingSettings: SettingsPatch = {}
let unverifiedSettings: SettingsPatch = {}
let settingsTimer: ReturnType<typeof setTimeout> | null = null

function sameValue(a: unknown, b: unknown) {
    return JSON.stringify(a) === JSON.stringify(b)
}

function mergeSettings(target: SettingsPatch, patch: SettingsPatch): SettingsPatch {
    const next = { ...target, ...patch }
    if (patch.seen_notices && typeof patch.seen_notices === 'object') {
        next.seen_notices = {
            ...((target.seen_notices as Record<string, unknown> | undefined) ?? {}),
            ...(patch.seen_notices as Record<string, unknown>),
        }
    }
    return next
}

function changedSettings(patch: SettingsPatch): SettingsPatch {
    const profile = overview?.profile as unknown as Record<string, unknown> | undefined
    if (!profile) return patch
    const changes: SettingsPatch = {}
    for (const [key, value] of Object.entries(patch)) {
        if (key === 'seen_notices' && value && typeof value === 'object') {
            const current = (profile.seen_notices as Record<string, unknown> | null) ?? {}
            const notices = Object.fromEntries(
                Object.entries(value as Record<string, unknown>).filter(([name, seen]) => !sameValue(current[name], seen)),
            )
            if (Object.keys(notices).length > 0) changes.seen_notices = notices
        } else if (!sameValue(profile[key], value)) {
            changes[key] = value
        }
    }
    return changes
}

function applySettingsLocally(patch: SettingsPatch) {
    if (!overview) return
    overview = {
        ...overview,
        profile: mergeSettings(overview.profile as unknown as SettingsPatch, patch) as unknown as PlayerProfile,
    }
}

function scheduleSettingsFlush() {
    if (settingsTimer) return
    settingsTimer = setTimeout(() => {
        settingsTimer = null
        void flushSettings()
    }, SETTINGS_FLUSH_MS)
}

async function flushSettings() {
    if (!overview) return
    if (Object.keys(unverifiedSettings).length > 0) {
        const changes = changedSettings(unverifiedSettings)
        unverifiedSettings = {}
        applySettingsLocally(changes)
        pendingSettings = mergeSettings(pendingSettings, changes)
    }
    const patch = pendingSettings
    pendingSettings = {}
    if (Object.keys(patch).length === 0) return

    const { data, error } = await supabase.rpc('update_my_settings', { p_patch: patch })
    if (error) {
        console.error('update_my_settings', error)
        await refreshOverview().catch(() => undefined)
        return
    }
    const result = data as Partial<Overview> | null
    if (result?.streaks) {
        overview = result as Overview
    } else if (result?.profile && overview) {
        overview = { ...overview, profile: result.profile }
    }
    applySettingsLocally(pendingSettings)
    emit()
}

export async function flushPlayerSettingsNow() {
    if (settingsTimer) {
        clearTimeout(settingsTimer)
        settingsTimer = null
    }
    await flushSettings()
}

function rememberIssuedRound(
    pool: 'unlimited' | 'hangul',
    difficulty: string,
    imageMode: string,
    images: Array<DailyImage | HangulImage>,
) {
    const first = images[0]
    if (!overview || !first || (!first.img_bucket && !first.hangul_name)) return
    const hangul = pool === 'hangul'
    const mode = hangul ? 'hangul' : 'infinite'
    const rowDifficulty = hangul ? '' : difficulty || 'normal'
    const rowImageMode = hangul ? '' : imageMode || 'pixelated'
    const existing = overview.active_games.find(
        (row) => row.mode === mode && row.difficulty === rowDifficulty && row.image_mode === rowImageMode,
    )
    if (existing?.idol?.img_bucket) return
    const limits = hangul
        ? { hints: 0, skips: 3 }
        : rowDifficulty === 'easy'
          ? { hints: 3, skips: 3 }
          : rowDifficulty === 'normal'
            ? { hints: 1, skips: 1 }
            : { hints: 0, skips: 0 }
    const game: ActiveGame = {
        mode,
        difficulty: rowDifficulty,
        image_mode: rowImageMode,
        guesses: [],
        guess_text: [],
        hints_remaining: limits.hints,
        skips_remaining: limits.skips,
        last_outcome: null,
        queue: images,
        queue_index: 0,
        idol: first,
    }
    const active_games = overview.active_games.filter(
        (row) => !(row.mode === mode && row.difficulty === rowDifficulty && row.image_mode === rowImageMode),
    )
    overview = { ...overview, active_games: [...active_games, game] }
    emit()
}

export async function takeUnlimitedImages(
    count: number,
    groupFilter: 'boy-group' | 'girl-group' | null | undefined,
    genFilter: number[] | undefined,
    difficulty: InfiniteDifficulty | string,
    imageMode: ImageMode | string,
    bind: boolean,
) {
    const images = await getMultipleRandomUnlimitedImages(count, groupFilter, genFilter, {
        difficulty,
        imageMode,
        bind,
    })
    if (bind && images.length > 0) {
        rememberIssuedRound('unlimited', difficulty, imageMode, images)
        void refreshOverview().catch(() => undefined)
    }
    return images
}

export async function takeHangulImages(
    count: number,
    groupFilter?: 'boy-group' | 'girl-group' | null,
    bind = false,
) {
    const images = await getMultipleRandomHangulImages(count, groupFilter, bind)
    if (bind && images.length > 0) {
        rememberIssuedRound('hangul', '', '', images)
        void refreshOverview().catch(() => undefined)
    }
    return images
}

// Settings are written from many mount effects. Skip values the profile already
// has and batch the rest into a single update_my_settings call.
export async function savePlayerSettings(patch: SettingsPatch) {
    if (Object.keys(patch).length === 0) return
    if (overview) {
        const changes = changedSettings(patch)
        if (Object.keys(changes).length === 0) return
        applySettingsLocally(changes)
        pendingSettings = mergeSettings(pendingSettings, changes)
    } else {
        unverifiedSettings = mergeSettings(unverifiedSettings, patch)
    }
    scheduleSettingsFlush()
}

export async function saveNickname(nickname: string) {
    const { data, error } = await supabase.rpc('set_nickname', { p_nickname: nickname })
    if (error) throw error
    if (data) {
        overview = data as Overview
        emit()
    }
    return overview
}

export async function fetchLeaderboard(mode: string, difficulty = '', imageMode = '') {
    const { data, error } = await supabase.rpc('get_leaderboard', {
        p_mode: mode,
        p_difficulty: difficulty,
        p_image_mode: imageMode,
        p_limit: 50,
    })
    if (error) throw error
    return data as {
        rows: Array<{ rank: number; nickname: string; max_streak: number; is_me: boolean }>
        me: { rank: number | null; nickname: string | null; max_streak: number; eligible: boolean; is_anonymous: boolean } | null
    }
}

function authRedirect() {
    return `${window.location.origin}/auth/callback`
}

async function stashGuestMerge() {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user?.is_anonymous) return
    const { data: code } = await supabase.rpc('prepare_guest_merge')
    if (typeof code === 'string' && code) {
        document.cookie = `ig_merge_code=${code}; path=/; max-age=900; samesite=lax`
    }
}

function emailTaken(error: { message: string; code?: string }) {
    if (error.code === 'email_exists' || error.code === 'user_already_exists') {
        return true
    }
    return /already (been )?registered|already exists/i.test(error.message)
}

export async function signInWithGoogle() {
    const redirectTo = authRedirect()
    await stashGuestMerge()
    const { data: userData } = await supabase.auth.getUser()
    if (userData.user?.is_anonymous) {
        const linked = await supabase.auth.linkIdentity({
            provider: 'google',
            options: { redirectTo },
        })
        if (!linked.error) return
    }
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
    })
    if (error) throw error
}

export async function signInWithEmail(email: string): Promise<'sent' | 'signed-in'> {
    const redirectTo = authRedirect()
    const normalized = email.trim().toLowerCase()
    const { data: userData } = await supabase.auth.getUser()

    if (userData.user?.is_anonymous) {
        const linked = await supabase.auth.updateUser(
            { email: normalized },
            { emailRedirectTo: redirectTo },
        )
        if (!linked.error) {
            const user = linked.data.user
            if (user && user.is_anonymous === false && user.email_confirmed_at) {
                await refreshOverview()
                return 'signed-in'
            }
            return 'sent'
        }
        if (!emailTaken(linked.error)) throw linked.error
    }

    await stashGuestMerge()
    const { error } = await supabase.auth.signInWithOtp({
        email: normalized,
        options: {
            emailRedirectTo: redirectTo,
            shouldCreateUser: true,
        },
    })
    if (error) throw error
    return 'sent'
}

export async function signOutToGuest() {
    await supabase.auth.signOut()
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error) throw error
    userId = data.user?.id ?? null
    await refreshOverview()
}

const LEGACY_KEYS = [
    'idol-guessr-stats',
    'idol-guessr-daily-progress',
    'idol-guessr-daily-completion',
    'idol-guessr-hangul-stats',
    'idol-guessr-hangul-game-state',
    'idol-guessr-feedback-tickets',
    'idol-guessr-challenge-progress',
]

function readJson<T>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key)
        return raw ? (JSON.parse(raw) as T) : null
    } catch {
        return null
    }
}

export async function importLegacyProgress() {
    if (typeof window === 'undefined') return
    if (overview?.profile.legacy_imported_at) return
    const keys = Object.keys(localStorage).filter((key) => key.startsWith('idol-guessr-'))
    if (keys.length === 0) {
        await supabase.rpc('import_legacy_progress', { p_payload: {} })
        await refreshOverview()
        return
    }

    const difficulties: InfiniteDifficulty[] = ['easy', 'normal', 'hard', 'challenger']
    const modes: ImageMode[] = ['pixelated', 'zoom']
    const unlimited = []
    for (const difficulty of difficulties) {
        for (const imageMode of modes) {
            const statsKey =
                (difficulty === 'normal' ? 'idol-guessr-unlimited-stats' : `idol-guessr-unlimited-stats-${difficulty}`) +
                (imageMode === 'zoom' ? '-zoom' : '')
            const stateKey =
                (difficulty === 'normal'
                    ? 'idol-guessr-unlimited-game-state'
                    : `idol-guessr-unlimited-game-state-${difficulty}`) + (imageMode === 'zoom' ? '-zoom' : '')
            const stats = readJson(statsKey)
            const game = readJson(stateKey)
            if (stats || game) unlimited.push({ difficulty, image_mode: imageMode, stats, game })
        }
    }

    const today = new Date().toDateString()
    const dailyStats = readJson<{ dailyCompletions?: Record<string, { won?: boolean }> }>('idol-guessr-stats')
    const payload = {
        settings: {
            input_mode: localStorage.getItem('idol-guessr-input-mode') === 'text' ? 'text' : 'keyboard',
            theme: localStorage.getItem('idol-guessr-theme') ?? 'system',
            difficulty: localStorage.getItem('idol-guessr-difficulty') ?? 'normal',
            image_mode: localStorage.getItem('idol-guessr-image-mode') ?? 'pixelated',
            group_filter: localStorage.getItem('idol-guessr-group-filter') ?? 'both',
            gen_filter: readJson('idol-guessr-gen-filter') ?? [2, 3, 4, 5],
            hangul_group_filter: localStorage.getItem('idol-guessr-hangul-group-filter') ?? 'both',
            game_mode: localStorage.getItem('idol-guessr-game-mode') ?? 'daily',
            seen_notices: {
                welcome: Boolean(localStorage.getItem('idol-guessr-has-visited')),
                zoomed: Boolean(localStorage.getItem('idol-guessr-zoomed-mode-notice-seen')),
            },
        },
        daily: {
            stats: dailyStats,
            attempts: readJson(`idol-guessr-guess-attempts-${today}`) ?? [],
            completion: dailyStats?.dailyCompletions?.[today] ?? null,
        },
        unlimited,
        hangul: {
            stats: readJson('idol-guessr-hangul-stats'),
            game: readJson('idol-guessr-hangul-game-state'),
        },
        feedback_tickets: readJson('idol-guessr-feedback-tickets') ?? [],
    }

    const { error } = await supabase.rpc('import_legacy_progress', { p_payload: payload })
    if (error) console.error('import_legacy_progress', error)
    keys.forEach((key) => {
        if (
            key.startsWith('idol-guessr-') &&
            key !== 'idol-guessr-theme' &&
            key !== 'seen-idols' &&
            key !== 'seen-hangul-idols'
        ) localStorage.removeItem(key)
    })
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))
    await refreshOverview()
}
