import type { ImageMode, InfiniteDifficulty } from '@/utils/difficulty'

export type DuelFormat = '1v1' | '2v2' | '1v2'
export type DuelGameMode = 'visual' | 'classic' | 'unshuffled'
export type DuelGroup = 'boy-group' | 'girl-group' | 'both'

export interface DuelConfig {
    game_mode: DuelGameMode
    image_mode: ImageMode
    difficulty: InfiniteDifficulty
    group: DuelGroup
    gens: number[]
}

export interface DuelPlayer {
    user_id: string
    team: 1 | 2
    nickname: string
    avatar_url: string | null
    left: boolean
}

export interface DuelLobby {
    id: string
    code: string
    host_id: string
    format: DuelFormat
    config: DuelConfig
    status: 'open' | 'in_match' | 'closed'
    match_id: string | null
    members: DuelPlayer[]
}

export interface DuelPublicIdol {
    id: number
    group_type: string
    img_bucket: string
    group_category: string
    base64_group: string
    gen: number | null
    zoom_x: number | null
    zoom_y: number | null
}

export interface DuelRoundPublic {
    round_no: number
    starts_at: string
    deadline: string
    multiplier: number
    idol: DuelPublicIdol
    my_guesses: string[]
    my_done: boolean
    max_guesses: number
    players_done: string[]
    correct_players: string[]
}

export interface DuelRoundResult {
    round_no: number
    answer: string
    team_scores: [number, number]
    player_scores: Record<string, number>
    damage: number
    damaged_team: 1 | 2 | null
    team_hp: [number, number]
}

export interface DuelState {
    match_id: string
    status: 'active' | 'finished' | 'abandoned'
    format: DuelFormat
    config: DuelConfig
    my_team: 1 | 2
    players: DuelPlayer[]
    team_hp: [number, number]
    current_round: DuelRoundPublic | null
    last_result: DuelRoundResult | null
    winner_team: 1 | 2 | null
    server_now: string
}

export interface DuelGuessResult {
    correct: boolean
    done: boolean
    guesses_left: number
    score: number
    deadline: string
    resolved_state: DuelState | null
}

export interface DuelLeaderboardRow {
    rank: number
    nickname: string
    avatar_url: string | null
    wins: number
    losses: number
    matches: number
    win_rate: number
    is_me: boolean
}

export interface DuelLeaderboardMe {
    rank: number | null
    nickname: string | null
    avatar_url: string | null
    wins: number
    losses: number
    matches: number
    win_rate: number
    is_me: boolean
    eligible: boolean
    matches_needed: number
}

export type DuelMatchEvent =
    | {
          type: 'player_guessed'
          user_id: string
          round_no: number
          correct: boolean
          done: boolean
          guess_count: number
          seconds: number | null
          deadline: string
      }
    | {
          type: 'round_resolved'
          result: DuelRoundResult
          next_round: DuelRoundPublic | null
          server_now: string
      }
    | {
          type: 'match_finished'
          winner_team: 1 | 2
          team_hp: [number, number]
          server_now: string
      }
    | { type: 'player_left'; user_id: string }

export interface GuessFeedItem {
    id: string
    userId: string
    text: string
}
