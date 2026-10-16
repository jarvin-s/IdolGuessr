import { apiPublicUrl } from './env.js'
import { supabase } from './supabase.js'
import {
  readSession,
  seal,
  type SessionMode,
  type SessionPayload,
} from './tokens.js'

const DAY_SECONDS = 60 * 60 * 24
const SESSION_TTL = 14 * DAY_SECONDS

export interface IdolRecord {
  id: number
  name: string
  altName: string | null
  groupType: string | null
  imgBucket: string
  groupCategory: string | null
  base64Group: string | null
  groupName: string | null
  hangulName: string | null
}

export interface PublicIdol {
  id: number
  session: string
  imageUrl: string
  nextImageUrl: string | null
  clearImageUrl: string | null
  pixelImageUrl: string | null
  hasHint: boolean
  groupCategory: string | null
  hangulName: string | null
  revealedName: string | null
  endAt?: string
  serverNow?: string
}

export interface GuessBody extends PublicIdol {
  correct: boolean
  gameOver: boolean
  won: boolean
  absentLetters: string[]
}

function imageUrl(path: string | null): string | null {
  if (!path) return null
  const token = seal({
    kind: 'image',
    path,
    exp: Math.floor(Date.now() / 1000) + DAY_SECONDS,
  })
  return `${apiPublicUrl}/images/${token}`
}

function objectPath(idol: IdolRecord, mode: SessionMode, file: string): string | null {
  if (mode === 'daily' || mode === 'history') {
    if (!idol.groupType || !idol.imgBucket) return null
    return `daily/${idol.groupType}/${idol.imgBucket}/${file}`
  }
  if (!idol.groupCategory || !idol.base64Group || !idol.imgBucket) return null
  return `unlimited/${idol.groupCategory}/${idol.base64Group}/${idol.imgBucket}/${file}`
}

function stageFile(
  guessesUsed: number,
  maxGuesses: number
): { current: string; next: string | null } {
  if (maxGuesses <= 3) {
    const stage = Math.min(guessesUsed + 1, 3)
    return {
      current: `00${stage}.png`,
      next: stage < 3 ? `00${stage + 1}.png` : null,
    }
  }
  const stage = Math.min(guessesUsed + 1, 5)
  return {
    current: `00${stage}.png`,
    next: stage < 5 ? `00${stage + 1}.png` : null,
  }
}

export function createSession(
  mode: SessionMode,
  idolId: number,
  maxGuesses: number,
  guessesUsed = 0,
  extra?: { done?: boolean; won?: boolean; challengeId?: string }
): string {
  const payload: SessionPayload = {
    kind: 'session',
    v: 1,
    mode,
    idolId,
    guessesUsed,
    maxGuesses,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL,
    done: extra?.done,
    won: extra?.won,
    challengeId: extra?.challengeId,
  }
  return seal(payload)
}

export function present(
  idol: IdolRecord,
  session: SessionPayload,
  token = ''
): PublicIdol {
  const signed =
    token ||
    createSession(session.mode, session.idolId, session.maxGuesses, session.guessesUsed, {
      done: session.done,
      won: session.won,
      challengeId: session.challengeId,
    })
  const showImages = session.mode !== 'hangul' || !!session.done
  const stage = stageFile(session.guessesUsed, session.maxGuesses)
  const currentPath = showImages
    ? objectPath(
        idol,
        session.mode,
        session.done ? 'clear.png' : stage.current
      )
    : null
  const nextPath =
    showImages && !session.done && stage.next
      ? objectPath(idol, session.mode, stage.next)
      : null
  const pixelPath = session.done ? objectPath(idol, session.mode, '001.png') : null

  return {
    id: idol.id,
    session: signed,
    imageUrl: imageUrl(currentPath) || '',
    nextImageUrl: imageUrl(nextPath),
    clearImageUrl: session.done ? imageUrl(objectPath(idol, session.mode, 'clear.png')) : null,
    pixelImageUrl: session.done ? imageUrl(pixelPath) : null,
    hasHint: !!idol.groupName,
    groupCategory: idol.groupCategory,
    hangulName: session.mode === 'hangul' ? idol.hangulName : null,
    revealedName: session.done ? idol.name : null,
    endAt: undefined,
    serverNow: undefined,
  }
}

function mapUnlimited(row: {
  id: number
  name: string
  alt_name?: string | null
  group_type?: string | null
  img_bucket: string
  group_category?: string | null
  base64_group?: string | null
  group_name?: string | null
}): IdolRecord {
  return {
    id: row.id,
    name: row.name,
    altName: row.alt_name ?? null,
    groupType: row.group_type ?? null,
    imgBucket: row.img_bucket,
    groupCategory: row.group_category ?? null,
    base64Group: row.base64_group ?? null,
    groupName: row.group_name ?? null,
    hangulName: null,
  }
}

function mapHangul(row: {
  id: number
  name: string
  alt_name?: string | null
  group_type?: string | null
  img_bucket: string
  group_category?: string | null
  base64_group?: string | null
  group_name?: string | null
  hangul_name?: string | null
}): IdolRecord {
  return {
    ...mapUnlimited(row),
    hangulName: row.hangul_name ?? null,
  }
}

function mapDaily(row: {
  id: number
  name: string
  group_type?: string | null
  img_bucket: string
  group_name?: string | null
}): IdolRecord {
  return {
    id: Number(row.id),
    name: row.name,
    altName: null,
    groupType: row.group_type ?? null,
    imgBucket: row.img_bucket,
    groupCategory: null,
    base64Group: null,
    groupName: row.group_name ?? null,
    hangulName: null,
  }
}

export async function loadIdol(
  mode: SessionMode,
  idolId: number
): Promise<IdolRecord | null> {
  if (mode === 'daily' || mode === 'history') {
    const { data, error } = await supabase
      .from('dailies')
      .select('id, name, group_type, img_bucket, group_name')
      .eq('id', idolId)
      .maybeSingle()
    if (error || !data) return null
    return mapDaily(data)
  }
  if (mode === 'hangul') {
    const { data, error } = await supabase
      .from('hangul_idols')
      .select(
        'id, name, alt_name, group_type, img_bucket, group_category, base64_group, group_name, hangul_name'
      )
      .eq('id', idolId)
      .maybeSingle()
    if (error || !data) return null
    return mapHangul(data)
  }
  const { data, error } = await supabase
    .from('unlimited_images')
    .select(
      'id, name, alt_name, group_type, img_bucket, group_category, base64_group, group_name'
    )
    .eq('id', idolId)
    .maybeSingle()
  if (error || !data) return null
  return mapUnlimited(data)
}

export async function viewSession(token: string): Promise<PublicIdol | null> {
  const { readSession } = await import('./tokens.js')
  const session = readSession(token)
  if (!session) return null
  const idol = await loadIdol(session.mode, session.idolId)
  if (!idol) return null
  const view = present(idol, session, token)
  if (session.done && session.won) {
    view.revealedName = matchedName(idol, idol.name)
  }
  return view
}

function matchedName(idol: IdolRecord, guessOrName: string): string {
  return guessOrName || idol.name
}

export function absentLetters(name: string, guess: string): string[] {
  const letters = new Set(name.toUpperCase().split(''))
  const missing = new Set<string>()
  for (const letter of guess.toUpperCase()) {
    if (!letters.has(letter)) missing.add(letter)
  }
  return [...missing]
}

export async function submitGuess(
  token: string,
  rawGuess: string
): Promise<GuessBody | null> {
  const { readSession } = await import('./tokens.js')
  const session = readSession(token)
  if (!session || session.done) {
    if (!session) return null
    const idol = await loadIdol(session.mode, session.idolId)
    if (!idol) return null
    const view = present(idol, session, token)
    return {
      ...view,
      correct: !!session.won,
      gameOver: true,
      won: !!session.won,
      absentLetters: [],
    }
  }

  const guess = rawGuess.toUpperCase().trim()
  if (!guess || guess.length > 40) return null

  const idol = await loadIdol(session.mode, session.idolId)
  if (!idol) return null

  const primary = idol.name.toUpperCase().trim()
  const alt = idol.altName?.toUpperCase().trim() || ''
  const allowAlt = session.mode !== 'daily' && session.mode !== 'history'
  let correct = guess === primary
  let revealed = idol.name
  if (!correct && allowAlt && alt && guess === alt) {
    correct = true
    revealed = idol.altName || idol.name
  }

  const guessesUsed = session.guessesUsed + 1
  const gameOver = correct || guessesUsed >= session.maxGuesses
  const next = createSession(
    session.mode,
    session.idolId,
    session.maxGuesses,
    guessesUsed,
    {
      done: gameOver,
      won: correct,
      challengeId: session.challengeId,
    }
  )
  const nextPayload: SessionPayload = {
    ...session,
    guessesUsed,
    done: gameOver,
    won: correct,
  }
  const view = present(idol, nextPayload, next)
  if (gameOver) view.revealedName = revealed

  return {
    ...view,
    correct,
    gameOver,
    won: correct,
    absentLetters:
      !correct && (session.mode === 'daily' || session.mode === 'history')
        ? absentLetters(idol.name, guess)
        : [],
  }
}

export async function hintFor(token: string): Promise<string | null> {
  const { readSession } = await import('./tokens.js')
  const session = readSession(token)
  if (!session) return null
  const idol = await loadIdol(session.mode, session.idolId)
  return idol?.groupName ?? null
}

export function amsterdamToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
  }).format(new Date())
}

export async function currentDaily(): Promise<PublicIdol | null> {
  const { data, error } = await supabase.rpc('get_current_daily')
  if (error) {
    console.error('get_current_daily:', error.message)
    return null
  }
  if (!data?.length) return null
  const row = data[0] as {
    id: number
    name: string
    group_type: string
    img_bucket: string
    end_at: string
    server_now: string
  }
  const idol = mapDaily(row)
  const session = createSession('daily', idol.id, 6, 0)
  const payload = readSession(session)
  if (!payload) return null
  const view = present(idol, payload, session)
  view.endAt = row.end_at
  view.serverNow = row.server_now
  return view
}

export async function historyByDate(date: string): Promise<PublicIdol | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  if (date > amsterdamToday()) return null
  const { data, error } = await supabase
    .from('dailies')
    .select('id, name, group_type, img_bucket, group_name, play_date')
    .gte('play_date', `${date}T00:00:00`)
    .lte('play_date', `${date}T23:59:59`)
    .maybeSingle()
  if (error || !data) return null
  const idol = mapDaily(data)
  const session = createSession('history', idol.id, 6, 0)
  const payload = readSession(session)
  if (!payload) return null
  return present(idol, payload, session)
}

export async function historyDates(): Promise<{
  dates: string[]
  firstDate: string | null
  lastDate: string | null
}> {
  const today = amsterdamToday()
  const { data, error } = await supabase
    .from('dailies')
    .select('play_date')
    .lte('play_date', `${today}T23:59:59`)
    .order('play_date', { ascending: true })
  if (error || !data) return { dates: [], firstDate: null, lastDate: null }
  const dates = data.map((row) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(
      new Date(row.play_date)
    )
  )
  return {
    dates,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
  }
}

export async function dailyCount(): Promise<number> {
  const today = amsterdamToday()
  const { count, error } = await supabase
    .from('dailies')
    .select('*', { count: 'exact', head: true })
    .lte('play_date', `${today}T23:59:59`)
  if (error) return 0
  return (count || 0) + 1
}

export async function todayGuessCount(): Promise<number> {
  const current = await currentDaily()
  if (!current) return 0
  const { count, error } = await supabase
    .from('guess_tracking')
    .select('*', { count: 'exact', head: true })
    .eq('image_id', current.id)
    .eq('is_correct', true)
  if (error) return 0
  return count ?? 0
}

function isActiveGenFilter(genFilter?: number[]): boolean {
  return !!genFilter && genFilter.length > 0 && genFilter.length < 4
}

export function clearImageFor(idol: IdolRecord, mode: SessionMode): string {
  const path =
    mode === 'daily' || mode === 'history'
      ? idol.groupType && idol.imgBucket
        ? `daily/${idol.groupType}/${idol.imgBucket}/clear.png`
        : null
      : idol.groupCategory && idol.base64Group && idol.imgBucket
        ? `unlimited/${idol.groupCategory}/${idol.base64Group}/${idol.imgBucket}/clear.png`
        : null
  return imageUrl(path) || ''
}

export function asPublic(
  idol: IdolRecord,
  mode: SessionMode,
  maxGuesses: number,
  challengeId?: string
): PublicIdol | null {
  const token = createSession(mode, idol.id, maxGuesses, 0, { challengeId })
  const payload = readSession(token)
  if (!payload) return null
  return present(idol, payload, token)
}

export async function nextUnlimited(input: {
  count: number
  groupFilter?: 'boy-group' | 'girl-group' | null
  genFilter?: number[]
  excludeIds?: number[]
  maxGuesses?: number
}): Promise<PublicIdol[]> {
  const count = Math.min(Math.max(input.count || 1, 1), 20)
  const maxGuesses = input.maxGuesses === 3 ? 3 : 6
  let excludedBuckets: string[] = []
  if (input.excludeIds?.length) {
    const { data } = await supabase
      .from('unlimited_images')
      .select('img_bucket')
      .in('id', input.excludeIds.slice(0, 500))
    excludedBuckets = (data || []).map((row) => row.img_bucket).filter(Boolean)
  }
  const fetchCount = count * (isActiveGenFilter(input.genFilter) ? 20 : 3)
  const { data, error } = await supabase.rpc('get_multiple_random_unlimited_test', {
    excluded_buckets: excludedBuckets,
    row_count: fetchCount,
  })
  if (error || !data) return []
  const rows = (data as Array<{
    id: number
    name: string
    alt_name?: string | null
    group_type?: string | null
    img_bucket: string
    group_category?: string | null
    base64_group?: string | null
    group_name?: string | null
    gen?: number | null
  }>).filter((row) => {
    if (!row.group_category || !row.base64_group) return false
    if (input.groupFilter && row.group_category !== input.groupFilter) return false
    if (isActiveGenFilter(input.genFilter)) {
      if (row.gen == null || !input.genFilter!.includes(row.gen)) return false
    }
    return true
  })
  const unique: PublicIdol[] = []
  const seen = new Set<number>()
  for (const row of rows) {
    if (seen.has(row.id) || unique.length >= count) continue
    seen.add(row.id)
    const idol = mapUnlimited(row)
    const token = createSession('infinite', idol.id, maxGuesses, 0)
    const payload = readSession(token)
    if (!payload) continue
    unique.push(present(idol, payload, token))
  }
  return unique
}

export async function nextHangul(input: {
  count: number
  groupFilter?: 'boy-group' | 'girl-group' | null
  excludeIds?: number[]
}): Promise<PublicIdol[]> {
  const count = Math.min(Math.max(input.count || 1, 1), 20)
  const excluded = new Set(input.excludeIds || [])
  const { data, error } = await supabase.rpc('get_multiple_random_hangul_idols', {
    excluded_buckets: [],
    row_count: count * 4,
    group_filter: input.groupFilter,
  })
  if (error || !data) return []
  const unique: PublicIdol[] = []
  const seen = new Set<number>()
  for (const row of data as Array<{
    id: number
    name: string
    hangul_name?: string | null
    alt_name?: string | null
    img_bucket: string
    group_category?: string | null
    base64_group?: string | null
    group_type?: string | null
    group_name?: string | null
  }>) {
    if (!row.hangul_name || !row.group_category || !row.base64_group) continue
    if (input.groupFilter && row.group_category !== input.groupFilter) continue
    if (excluded.has(row.id) || seen.has(row.id)) continue
    seen.add(row.id)
    const idol = mapHangul(row)
    const token = createSession('hangul', idol.id, 3, 0)
    const payload = readSession(token)
    if (!payload) continue
    unique.push(present(idol, payload, token))
    if (unique.length >= count) break
  }
  return unique
}
