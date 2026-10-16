const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
).replace(/\/+$/, '')

export interface PlayIdol {
  id: number
  session: string
  imageUrl: string
  nextImageUrl: string | null
  clearImageUrl: string | null
  pixelImageUrl: string | null
  img_bucket: string
  group_type: string
  group_category?: string
  group_name?: string
  hasHint: boolean
  hangul_name?: string
  name?: string
  endAt?: string
  serverNow?: string
}

export interface GuessResult {
  correct: boolean
  gameOver: boolean
  won: boolean
  absentLetters: string[]
  idol: PlayIdol
}

interface ApiIdol {
  id: number
  session: string
  imageUrl: string
  nextImageUrl: string | null
  clearImageUrl: string | null
  pixelImageUrl: string | null
  hasHint: boolean
  groupCategory?: string | null
  hangulName?: string | null
  revealedName?: string | null
  endAt?: string
  serverNow?: string
}

const SEEN_UNLIMITED_KEY = 'idol-guessr-seen-idol-ids'
const SEEN_HANGUL_KEY = 'idol-guessr-seen-hangul-ids'

function readIds(key: string): number[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === 'number')
      : []
  } catch {
    return []
  }
}

function writeIds(key: string, ids: number[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(ids))
}

export function getSeenIdolIds(): number[] {
  return readIds(SEEN_UNLIMITED_KEY)
}

export function addSeenIdolId(id: number) {
  const seen = getSeenIdolIds()
  if (!seen.includes(id)) writeIds(SEEN_UNLIMITED_KEY, [...seen, id])
}

export function clearSeenIdolIds() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SEEN_UNLIMITED_KEY)
}

export function getSeenHangulIds(): number[] {
  return readIds(SEEN_HANGUL_KEY)
}

export function addSeenHangulId(id: number) {
  const seen = getSeenHangulIds()
  if (!seen.includes(id)) writeIds(SEEN_HANGUL_KEY, [...seen, id])
}

export function clearSeenHangulIds() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SEEN_HANGUL_KEY)
}

export function toPlayIdol(row: ApiIdol, previous?: Partial<PlayIdol>): PlayIdol {
  return {
    id: row.id,
    session: row.session,
    imageUrl: row.imageUrl,
    nextImageUrl: row.nextImageUrl,
    clearImageUrl: row.clearImageUrl,
    pixelImageUrl: row.pixelImageUrl,
    img_bucket: `idol-${row.id}`,
    group_type: '',
    group_category: row.groupCategory || previous?.group_category,
    group_name: previous?.group_name,
    hasHint: row.hasHint,
    hangul_name: row.hangulName || previous?.hangul_name,
    name: row.revealedName || previous?.name,
    endAt: row.endAt,
    serverNow: row.serverNow,
  }
}

export function applyGuess(idol: PlayIdol, row: ApiIdol): PlayIdol {
  return toPlayIdol(row, idol)
}

async function request<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers:
        body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (!response.ok) return null
    return (await response.json()) as T
  } catch (error) {
    console.error(`Game API ${path} failed:`, error)
    return null
  }
}

export async function fetchCurrentDaily(): Promise<PlayIdol | null> {
  const row = await request<ApiIdol>('/daily/current', {})
  return row ? toPlayIdol(row) : null
}

export async function fetchDailyCount(): Promise<number> {
  const row = await request<{ count: number }>('/daily/count')
  return row?.count ?? 0
}

export async function fetchTodayGuessCount(): Promise<number> {
  const row = await request<{ count: number }>('/daily/today-count')
  return row?.count ?? 0
}

export async function fetchHistoryDates(): Promise<{
  dates: string[]
  firstDate: string | null
  lastDate: string | null
}> {
  const row = await request<{
    dates: string[]
    firstDate: string | null
    lastDate: string | null
  }>('/history/dates')
  return row || { dates: [], firstDate: null, lastDate: null }
}

export async function fetchHistoryIdol(date: string): Promise<PlayIdol | null> {
  const row = await request<ApiIdol>('/history/by-date', { date })
  return row ? toPlayIdol(row) : null
}

export async function fetchUnlimitedIdols(
  count: number,
  groupFilter?: 'boy-group' | 'girl-group' | null,
  genFilter?: number[],
  maxGuesses = 6
): Promise<PlayIdol[]> {
  const row = await request<{ idols: ApiIdol[] }>('/infinite/next', {
    count,
    groupFilter,
    genFilter,
    excludeIds: getSeenIdolIds(),
    maxGuesses,
  })
  return (row?.idols || []).map((idol) => toPlayIdol(idol))
}

export async function fetchHangulIdols(
  count: number,
  groupFilter?: 'boy-group' | 'girl-group' | null
): Promise<PlayIdol[]> {
  const row = await request<{ idols: ApiIdol[] }>('/hangul/next', {
    count,
    groupFilter,
    excludeIds: getSeenHangulIds(),
  })
  return (row?.idols || []).map((idol) => toPlayIdol(idol))
}

export async function submitIdolGuess(
  session: string,
  guess: string
): Promise<GuessResult | null> {
  const row = await request<
    ApiIdol & {
      correct: boolean
      gameOver: boolean
      won: boolean
      absentLetters: string[]
    }
  >('/guess', { session, guess })
  if (!row) return null
  return {
    correct: row.correct,
    gameOver: row.gameOver,
    won: row.won,
    absentLetters: row.absentLetters || [],
    idol: toPlayIdol(row),
  }
}

export async function fetchGroupHint(session: string): Promise<string | null> {
  const row = await request<{ groupName: string }>('/hint', { session })
  return row?.groupName ?? null
}

export interface PlayChallenge {
  id: string
  idol_count: number
  group_filter: string
  created_at: string
  idols: PlayIdol[]
}

export async function createPlayChallenge(
  sessionId: string,
  idolCount: number,
  groupFilter: string
): Promise<string | null> {
  const row = await request<{ id: string }>('/challenge', {
    sessionId,
    idolCount,
    groupFilter,
  })
  return row?.id ?? null
}

export async function fetchPlayChallenge(
  challengeId: string
): Promise<PlayChallenge | null> {
  const row = await request<{
    id: string
    idol_count: number
    group_filter: string
    created_at: string
    idols: ApiIdol[]
  }>('/challenge/play', { challengeId })
  if (!row) return null
  return {
    ...row,
    idols: (row.idols || []).map((idol) => toPlayIdol(idol)),
  }
}

export interface RevealedChallengeIdol {
  id: number
  name: string
  group_name?: string | null
  img_bucket: string
  clearImageUrl: string
}

export interface RevealedChallenge {
  id: string
  idol_count: number
  group_filter: string
  created_at: string
  idols: RevealedChallengeIdol[]
}

export async function fetchRevealedChallenge(
  challengeId: string
): Promise<RevealedChallenge | null> {
  return request<RevealedChallenge>('/challenge/revealed', { challengeId })
}

export async function fetchChallengeResultRows(challengeId: string) {
  const row = await request<{ results: unknown[] }>('/challenge/results', {
    challengeId,
  })
  return row?.results || []
}

export async function submitPlayChallenge(input: {
  challengeId: string
  sessionId: string
  nickname: string | null
  results: unknown
  totalCorrect: number
}): Promise<string | null> {
  const row = await request<{ id: string }>('/challenge/submit', input)
  return row?.id ?? null
}

export async function fetchChallengePlayed(
  challengeId: string,
  sessionId: string
): Promise<boolean> {
  const row = await request<{ played: boolean }>('/challenge/played', {
    challengeId,
    sessionId,
  })
  return !!row?.played
}

export function toStoredIdol(idol: PlayIdol) {
  return {
    id: idol.id,
    session: idol.session,
    imageUrl: idol.imageUrl,
    nextImageUrl: idol.nextImageUrl,
    clearImageUrl: idol.clearImageUrl,
    pixelImageUrl: idol.pixelImageUrl,
    hasHint: idol.hasHint,
    groupCategory: idol.group_category,
    hangulName: idol.hangul_name,
    groupName: idol.group_name,
  }
}

export function fromStoredIdol(stored: {
  id: number
  session: string
  imageUrl: string
  nextImageUrl: string | null
  clearImageUrl: string | null
  pixelImageUrl: string | null
  hasHint: boolean
  groupCategory?: string
  hangulName?: string
  groupName?: string
}): PlayIdol {
  return {
    id: stored.id,
    session: stored.session,
    imageUrl: stored.imageUrl,
    nextImageUrl: stored.nextImageUrl,
    clearImageUrl: stored.clearImageUrl,
    pixelImageUrl: stored.pixelImageUrl,
    img_bucket: `idol-${stored.id}`,
    group_type: '',
    group_category: stored.groupCategory,
    group_name: stored.groupName,
    hasHint: stored.hasHint,
    hangul_name: stored.hangulName,
  }
}
