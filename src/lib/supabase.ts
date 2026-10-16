import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type TicketCategory = 'general' | 'bug' | 'feature' | 'improvement'

export interface FeedbackTicket {
  id: string;
  ticket_number?: number | null;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  last_user_message_at: string | null;
  last_admin_message_at: string | null;
}

export interface FeedbackMessage {
  id: number;
  ticket_id: string;
  sender: 'user' | 'admin';
  body: string;
  created_at: string;
}

export interface FeedbackThread {
  ticket: FeedbackTicket;
  messages: FeedbackMessage[];
}


export async function createFeedbackTicket(
  category: TicketCategory,
  message: string,
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
  tickets: { id: string; token: string }[],
): Promise<FeedbackTicket[]> {
  if (tickets.length === 0) return []
  const { data, error } = await supabase.rpc('get_my_feedback_tickets', {
    p_tickets: tickets,
  })
  if (error) throw error
  return (data ?? []) as FeedbackTicket[]
}

export async function getFeedbackThread(ticketId: string, token: string): Promise<FeedbackThread> {
  const { data, error } = await supabase.rpc('get_feedback_thread', {
    p_ticket_id: ticketId,
    p_token: token,
  })
  if (error) throw error
  return data as FeedbackThread
}

export async function addFeedbackMessage(ticketId: string, token: string, body: string): Promise<void> {
  const { error } = await supabase.rpc('add_feedback_message', {
    p_ticket_id: ticketId,
    p_token: token,
    p_body: body,
  })
  if (error) throw error
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
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

export async function adminListTickets(status?: TicketStatus | 'all'): Promise<FeedbackTicket[]> {
  let query = supabase
    .from('feedback_tickets')
    .select('id, category, subject, status, created_at, updated_at, last_user_message_at, last_admin_message_at')
    .order('updated_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as FeedbackTicket[]
}

export async function adminGetThread(ticketId: string): Promise<FeedbackThread> {
  const [ticketRes, messagesRes] = await Promise.all([
    supabase
      .from('feedback_tickets')
      .select('id, category, subject, status, created_at, updated_at, last_user_message_at, last_admin_message_at')
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

export async function adminReply(ticketId: string, body: string): Promise<void> {
  const { error } = await supabase.from('feedback_messages').insert({
    ticket_id: ticketId,
    sender: 'admin',
    body,
  })
  if (error) throw error
}

export async function adminSetStatus(ticketId: string, status: TicketStatus): Promise<void> {
  const { error } = await supabase
    .from('feedback_tickets')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
  if (error) throw error
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
  difficulty: 'easy' | 'normal' | 'hard' | 'challenger'
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
  streak: number,
  difficulty: UnlimitedGameData['difficulty'] = 'normal'
): Promise<void> {
  if (streak < 1) {
    return
  }

  try {
    const gameData: UnlimitedGameData = {
      session_id: getOrCreateSessionId(),
      streak: streak,
      difficulty,
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
  const { fetchDailyCount } = await import('@/lib/gameApi')
  return fetchDailyCount()
}

export async function getTodayDailyGuessCount(): Promise<number> {
  const { fetchTodayGuessCount } = await import('@/lib/gameApi')
  return fetchTodayGuessCount()
}


export async function getAvailableDailyDates() {
  const { fetchHistoryDates } = await import('@/lib/gameApi')
  return fetchHistoryDates()
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

