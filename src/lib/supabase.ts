import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
}

export interface HangulImage extends DailyImage {
  hangul_name: string
}

export interface CurrentDaily {
  id: number;
  name: string;
  group_type: string;
  play_date: string;
  img_bucket: string;
  end_at: string;
  server_now: string;
}

export interface Feedback {
  id: number;
  message: string;
  category: string;
  created_at?: string;
}

export async function getDailyImage(): Promise<CurrentDaily | null> {
  const { data, error } = await supabase.rpc('get_current_daily');
  if (error || !data?.length) {
    console.error('get_current_daily error:', error);
    return null;
  }
  return data[0] as CurrentDaily;
}

export function getSeenIdols(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const seen = localStorage.getItem('idol-guessr-seen-idols')
    return seen ? JSON.parse(seen) : []
  } catch {
    return []
  }
}

export function addSeenIdol(imgBucket: string): void {
  if (typeof window === 'undefined') return
  try {
    const seen = getSeenIdols()
    if (!seen.includes(imgBucket)) {
      seen.push(imgBucket)
      localStorage.setItem('idol-guessr-seen-idols', JSON.stringify(seen))
      // console.log(`[Seen Idols] Added ${imgBucket}. Total seen: ${seen.length}`)
    }
  } catch (error) {
    console.error('Error adding seen idol:', error)
  }
}

export function clearSeenIdols(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('idol-guessr-seen-idols')
    // console.log('[Seen Idols] Cleared all seen idols (pool reset)')
  } catch (error) {
    console.error('Error clearing seen idols:', error)
  }
}

// Hangul mode seen idols tracking (separate from unlimited)
export function getSeenHangulIdols(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const seen = localStorage.getItem('idol-guessr-seen-hangul-idols')
    return seen ? JSON.parse(seen) : []
  } catch {
    return []
  }
}

export function addSeenHangulIdol(imgBucket: string): void {
  if (typeof window === 'undefined') return
  try {
    const seen = getSeenHangulIdols()
    if (!seen.includes(imgBucket)) {
      seen.push(imgBucket)
      localStorage.setItem('idol-guessr-seen-hangul-idols', JSON.stringify(seen))
    }
  } catch (error) {
    console.error('Error adding seen hangul idol:', error)
  }
}

export function clearSeenHangulIdols(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem('idol-guessr-seen-hangul-idols')
  } catch (error) {
    console.error('Error clearing seen hangul idols:', error)
  }
}

export async function getMultipleRandomHangulImages(
  count: number,
  groupFilter?: 'boy-group' | 'girl-group' | null
): Promise<HangulImage[]> {
  const seenIdols = getSeenHangulIdols();

  const fetchCount = count * 3;
  const { data, error } = await supabase.rpc('get_multiple_random_hangul_idols', {
    excluded_buckets: seenIdols,
    row_count: fetchCount
  });

  if (error) {
    console.error('[Hangul DB Request] Error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    clearSeenHangulIdols();

    const { data: retryData, error: retryError } = await supabase.rpc('get_multiple_random_hangul_idols', {
      excluded_buckets: [],
      row_count: count
    });

    if (retryError || !retryData) {
      console.error('get_multiple_random_hangul retry error:', retryError);
      return [];
    }

    const validRetryData = retryData.filter((img: HangulImage) => {
      // Only hangul_name is required - image data is optional
      if (!img.hangul_name) {
        return false;
      }
      if (groupFilter && img.group_category !== groupFilter) {
        return false;
      }
      return true;
    });

    return validRetryData.slice(0, count);
  }

  const uniqueImages: HangulImage[] = [];
  const seenBuckets = new Set<string>();

  for (const image of data) {
    // Only hangul_name is required - image data is optional
    if (!image.hangul_name) {
      continue;
    }

    if (groupFilter && image.group_category !== groupFilter) {
      continue;
    }

    // Use id as fallback if no img_bucket for deduplication
    const uniqueKey = image.img_bucket || `id-${image.id}`;
    if (!seenBuckets.has(uniqueKey) && uniqueImages.length < count) {
      uniqueImages.push(image);
      seenBuckets.add(uniqueKey);
    }
  }

  if (uniqueImages.length < count && seenIdols.length > 0) {
    clearSeenHangulIdols();

    const { data: retryData, error: retryError } = await supabase.rpc('get_multiple_random_hangul_idols', {
      excluded_buckets: [],
      row_count: count
    });

    if (retryError || !retryData) {
      console.error('get_multiple_random_hangul retry error:', retryError);
      return uniqueImages;
    }

    const validRetryData = retryData.filter((img: HangulImage) => {
      // Only hangul_name is required - image data is optional
      if (!img.hangul_name) {
        return false;
      }
      if (groupFilter && img.group_category !== groupFilter) {
        return false;
      }
      return true;
    });

    return validRetryData.slice(0, count);
  }

  return uniqueImages;
}

export async function getMultipleRandomUnlimitedImages(
  count: number,
  groupFilter?: 'boy-group' | 'girl-group' | null,
  genFilter?: number[]
): Promise<DailyImage[]> {
  const seenIdols = getSeenIdols();

  const isFilteringByGen = genFilter && genFilter.length > 0 && genFilter.length < 3;

  const passesFilters = (img: DailyImage): boolean => {
    if (!img.group_category || !img.base64_group) {
      return false;
    }
    if (groupFilter && img.group_category !== groupFilter) {
      return false;
    }
    if (isFilteringByGen) {
      if (img.gen === undefined || img.gen === null) {
        return false;
      }
      if (!genFilter!.includes(img.gen)) {
        return false;
      }
    }
    return true;
  };

  const fetchMultiplier = isFilteringByGen ? 20 : 3;
  const fetchCount = count * fetchMultiplier;

  const { data, error } = await supabase.rpc('get_multiple_random_unlimited_test', {
    excluded_buckets: seenIdols,
    row_count: fetchCount
  });

  if (error) {
    console.error('[DB Request] Error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    if (!isFilteringByGen) {
      clearSeenIdols();
    }

    const retryFetchCount = isFilteringByGen ? fetchCount : count;
    const { data: retryData, error: retryError } = await supabase.rpc('get_multiple_random_unlimited_test', {
      excluded_buckets: [],
      row_count: retryFetchCount
    });

    if (retryError || !retryData) {
      console.error('get_multiple_random_unlimited retry error:', retryError);
      return [];
    }

    const validRetryData = retryData.filter((img: DailyImage) => {
      if (!passesFilters(img)) {
        return false;
      }
      return true;
    });

    return validRetryData.slice(0, count);
  }

  const uniqueImages: DailyImage[] = [];
  const seenBuckets = new Set<string>();

  for (const image of data) {
    if (!passesFilters(image)) {
      continue;
    }

    if (!seenBuckets.has(image.img_bucket) && uniqueImages.length < count) {
      uniqueImages.push(image);
      seenBuckets.add(image.img_bucket);
    }
  }

  if (uniqueImages.length < count && seenIdols.length > 0) {
    if (!isFilteringByGen || uniqueImages.length === 0) {
      clearSeenIdols();
    }

    const retryFetchCount = isFilteringByGen ? fetchCount : count;
    const { data: retryData, error: retryError } = await supabase.rpc('get_multiple_random_unlimited_test', {
      excluded_buckets: [],
      row_count: retryFetchCount
    });

    if (retryError || !retryData) {
      console.error('get_multiple_random_unlimited_test retry error:', retryError);
      return uniqueImages;
    }

    const validRetryData = retryData.filter((img: DailyImage) => {
      if (!passesFilters(img)) {
        return false;
      }
      return true;
    });

    if (validRetryData.length > 0) {
      const additionalNeeded = count - uniqueImages.length;
      const additional = validRetryData.slice(0, additionalNeeded);
      return [...uniqueImages, ...additional];
    }

    return uniqueImages;
  }

  return uniqueImages;
}

export async function insertNewFeedback(feedback: Feedback): Promise<void> {
  const { error } = await supabase.from('feedback').insert({
    message: feedback.message,
    category: feedback.category,
    created_at: new Date().toISOString(),
  })
  if (error) {
    // console.log('insert_new_feedback error:', error.message)
    return
  }
}

export function getImageUrl(
  groupType: string,
  imgBucket: string,
  guessNumber: number | 'clear',
  mode: 'daily' | 'unlimited' = 'daily',
  groupCategory?: string,
  base64Group?: string,
): string {
  const fileName = guessNumber === 'clear' ? 'clear.png' : `00${guessNumber}.png`

  // Normalize supabaseUrl by removing trailing slash
  const normalizedUrl = supabaseUrl.replace(/\/+$/, '')

  if (mode === 'unlimited') {
    if (!groupCategory || !base64Group || !imgBucket) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[getImageUrl] Missing required fields for unlimited mode:', {
          groupCategory,
          base64Group,
          imgBucket,
          groupType
        })
      }
      return ''
    }
    return `${normalizedUrl}/storage/v1/object/public/images/unlimited/${groupCategory}/${base64Group}/${imgBucket}/${fileName}`
  }

  return `${normalizedUrl}/storage/v1/object/public/images/${mode}/${groupType}/${imgBucket}/${fileName}`
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
        groupCategory, base64Group, imgBucket
      });
    }
    return '';
  }

  const normalizedUrl = supabaseUrl.replace(/\/+$/, '');
  const fileName = imageType === 'hint' ? 'hint.png' : 'clear.png';
  return `${normalizedUrl}/storage/v1/object/public/images/hangul/${groupCategory}/${base64Group}/${imgBucket}/${fileName}`;
}

export interface GuessTrackingData {
  session_id: string
  image_id: number
  guesses: string[]
  guess_text: string  // Keep for backwards compatibility with existing DB column
  is_correct: boolean
  guess_number: number
  guess_time: string
  time_since_previous_guess: number | null  // Keep for backwards compatibility
  user_agent: string | null
  device_type: string | null
  browser: string | null
}

export interface UnlimitedGameData {
  session_id: string
  streak: number
}

export interface HangulGameData {
  session_id: string
  streak: number
}

function getDeviceType(userAgent: string): string {
  if (/mobile/i.test(userAgent)) return 'mobile'
  if (/tablet|ipad/i.test(userAgent)) return 'tablet'
  return 'desktop'
}

function getBrowser(userAgent: string): string {
  if (/edg/i.test(userAgent)) return 'edge'
  if (/chrome/i.test(userAgent)) return 'chrome'
  if (/firefox/i.test(userAgent)) return 'firefox'
  if (/safari/i.test(userAgent)) return 'safari'
  return 'other'
}

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('idol-guessr-session-id')
  if (!sessionId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      sessionId = crypto.randomUUID()
    } else {
      sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }
    sessionStorage.setItem('idol-guessr-session-id', sessionId)
  }
  return sessionId
}

export async function trackDailyGameEnd(
  imageId: number,
  guesses: string[],
  won: boolean
): Promise<void> {
  try {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null

    const guessData: GuessTrackingData = {
      session_id: getOrCreateSessionId(),
      image_id: imageId,
      guesses: guesses,
      guess_text: guesses.join(', '),  // Backwards compatibility: store as comma-separated string
      is_correct: won,
      guess_number: guesses.length,
      guess_time: new Date().toISOString(),
      time_since_previous_guess: null,  // No longer tracked per-guess
      user_agent: userAgent,
      device_type: userAgent ? getDeviceType(userAgent) : null,
      browser: userAgent ? getBrowser(userAgent) : null,
    }

    await supabase.from('guess_tracking').insert(guessData)
  } catch (error) {
    console.error('Error tracking daily game:', error)
  }
}

// Keep for backwards compatibility during transition
export function resetGuessTimer(): void {
  // No longer needed but kept to avoid breaking imports
}

export async function trackUnlimitedGame(
  streak: number
): Promise<void> {
  if (streak < 1) {
    return
  }

  try {
    const gameData: UnlimitedGameData = {
      session_id: getOrCreateSessionId(),
      streak: streak
    }

    const { error } = await supabase.from('unlimited_game_tracking').insert(gameData)

    if (error) {
      console.error('Error tracking unlimited game:', error)
    }
  } catch (error) {
    console.error('Error tracking unlimited game:', error)
  }
}

export async function trackHangulGame(
  streak: number
): Promise<void> {
  if (streak < 1) {
    return
  }

  try {
    const gameData: HangulGameData = {
      session_id: getOrCreateSessionId(),
      streak: streak
    }

    const { error } = await supabase.from('hangul_game_tracking').insert(gameData)

    if (error) {
      console.error('Error tracking hangul game:', error)
    }
  } catch (error) {
    console.error('Error tracking hangul game:', error)
  }
}

export async function getDailyCount(): Promise<number> {
  const now = new Date();
  const gmtPlus1 = new Date(now.getTime() + (60 * 60 * 1000));
  const today = gmtPlus1.toISOString().split('T')[0];

  const { count, error } = await supabase
    .from('dailies')
    .select('*', { count: 'exact' })
    .lte('play_date', today);

  if (error) {
    console.error('Error getting daily count:', error);
    return 0;
  }
  return (count || 0) + 1;
}

export interface HistoryDailyImage extends DailyImage {
  play_date: string;
}

export async function getDailyImageByDate(date: string): Promise<HistoryDailyImage | null> {
  const startOfDay = `${date}T00:00:00`;
  const endOfDay = `${date}T23:59:59`;

  const { data, error } = await supabase
    .from('dailies')
    .select('*')
    .gte('play_date', startOfDay)
    .lte('play_date', endOfDay)
    .single();

  if (error) {
    return null;
  }

  return data as HistoryDailyImage;
}

export async function getAvailableDailyDates(): Promise<{ dates: string[], firstDate: string | null, lastDate: string | null }> {
  const now = new Date();
  const gmtPlus1 = new Date(now.getTime() + (60 * 60 * 1000));
  const today = gmtPlus1.toISOString().split('T')[0];
  const endOfToday = `${today}T23:59:59`;

  const { data, error } = await supabase
    .from('dailies')
    .select('play_date')
    .lte('play_date', endOfToday)
    .order('play_date', { ascending: true });

  if (error) {
    return { dates: [], firstDate: null, lastDate: null };
  }

  const dates = data?.map(d => {
    const playDate = new Date(d.play_date);
    const year = playDate.getFullYear();
    const month = String(playDate.getMonth() + 1).padStart(2, '0');
    const day = String(playDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }) || [];

  return {
    dates,
    firstDate: dates.length > 0 ? dates[0] : null,
    lastDate: dates.length > 0 ? dates[dates.length - 1] : null
  };
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
  groupFilter: 'boy-group' | 'girl-group' | 'both' = 'both'
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('create_challenge', {
      p_session_id: sessionId,
      p_idol_count: idolCount,
      p_group_filter: groupFilter
    })

    if (error) {
      console.error('Error creating challenge:', error)
      return null
    }

    return data as string
  } catch (error) {
    console.error('Error creating challenge:', error)
    return null
  }
}

export async function getChallenge(challengeId: string): Promise<Challenge | null> {
  try {
    const { data, error } = await supabase.rpc('get_challenge', {
      p_challenge_id: challengeId
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
      created_at: row.created_at,
      expires_at: row.expires_at,
      idols: row.idols || []
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
      p_total_correct: totalCorrect
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

export async function getChallengeResults(challengeId: string): Promise<ChallengeResult[]> {
  try {
    const { data, error } = await supabase.rpc('get_challenge_results', {
      p_challenge_id: challengeId
    })

    if (error) {
      console.error('Error getting challenge results:', error)
      return []
    }

    return (data || []).map((row: {
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
      completed_at: row.completed_at
    }))
  } catch (error) {
    console.error('Error getting challenge results:', error)
    return []
  }
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