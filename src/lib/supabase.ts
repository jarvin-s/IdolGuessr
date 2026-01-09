import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface DailyImage {
  id: number  // int4 in database
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
  groupFilter?: 'boy-group' | 'girl-group' | null
): Promise<DailyImage[]> {
  const seenIdols = getSeenIdols();

  // console.log('[DB Request] Fetching unlimited idols:',
  //   {
  //     requested_count: count,
  //     fetch_count: count * 3,
  //     excluded_idols: seenIdols.length,
  //     excluded_list: seenIdols,
  //   });

  // Try to fetch with exclusions first (3x count to ensure we get enough after deduplication)
  const fetchCount = count * 3;
  const { data, error } = await supabase.rpc('get_multiple_random_unlimited', {
    excluded_buckets: seenIdols,
    row_count: fetchCount
  });

  if (error) {
    console.error('[DB Request] Error:', error);
    return [];
  }

  // console.log('[DB Response] Received:', {
  //   received_count: data?.length || 0,
  //   idols: data?.map((img: DailyImage) => img.img_bucket).slice(0, 10) || [], // Show first 10
  // });

  if (!data || data.length === 0) {
    // console.log('[Prefetch] No unseen idols available, clearing seen history...');
    clearSeenIdols();

    const { data: retryData, error: retryError } = await supabase.rpc('get_multiple_random_unlimited', {
      excluded_buckets: [],
      row_count: count
    });

    if (retryError || !retryData) {
      console.error('get_multiple_random_unlimited retry error:', retryError);
      return [];
    }

    const validRetryData = retryData.filter((img: DailyImage) => {
      if (!img.group_category || !img.base64_group) {
        console.warn('[Prefetch] Skipping image with missing data in retry:', {
          name: img.name,
          img_bucket: img.img_bucket,
          has_group_category: !!img.group_category,
          has_base64_group: !!img.base64_group,
        });
        return false;
      }
      if (groupFilter && img.group_category !== groupFilter) {
        return false;
      }
      return true;
    });

    // console.log(`[Prefetch] After reset: fetched ${validRetryData.length} idols:`, validRetryData.map((img: DailyImage) => img.name));
    return validRetryData.slice(0, count);
  }

  // Remove duplicates (same img_bucket), filter invalid data, and limit to requested count
  const uniqueImages: DailyImage[] = [];
  const seenBuckets = new Set<string>();

  for (const image of data) {
    if (!image.group_category || !image.base64_group) {
      continue;
    }

    if (groupFilter && image.group_category !== groupFilter) {
      continue;
    }

    if (!seenBuckets.has(image.img_bucket) && uniqueImages.length < count) {
      uniqueImages.push(image);
      seenBuckets.add(image.img_bucket);
    }
  }

  // console.log(`[Prefetch] Fetched ${uniqueImages.length}/${count} unique unseen idols:`, uniqueImages.map(img => ({
  //   name: img.name,
  //   img_bucket: img.img_bucket,
  //   group_category: img.group_category,
  //   base64_group: img.base64_group,
  // })));

  // If we still don't have enough, clear and retry
  if (uniqueImages.length < count && seenIdols.length > 0) {
    // console.log('[Prefetch] Insufficient unique images, clearing seen history...');
    clearSeenIdols();

    const { data: retryData, error: retryError } = await supabase.rpc('get_multiple_random_unlimited', {
      excluded_buckets: [],
      row_count: count
    });

    if (retryError || !retryData) {
      console.error('get_multiple_random_unlimited retry error:', retryError);
      return uniqueImages; // Return what we have
    }

    // Filter out invalid data from second retry
    const validRetryData = retryData.filter((img: DailyImage) => {
      if (!img.group_category || !img.base64_group) {
        // console.warn('[Prefetch] Skipping image with missing data in second retry:', {
        //   name: img.name,
        //   img_bucket: img.img_bucket,
        //   has_group_category: !!img.group_category,
        //   has_base64_group: !!img.base64_group,
        // });
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
  unlimited_id: number
  amount_of_guesses: number
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
  unlimitedId: number,
  amountOfGuesses: number,
  streak: number
): Promise<void> {
  if (amountOfGuesses < 1) {
    return
  }

  try {
    const gameData: UnlimitedGameData = {
      session_id: getOrCreateSessionId(),
      unlimited_id: unlimitedId,
      amount_of_guesses: amountOfGuesses,
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