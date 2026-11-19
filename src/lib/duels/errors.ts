const MESSAGES: Record<string, string> = {
    not_authenticated: 'Still signing you in. Try again in a moment.',
    not_host: 'Only the host can do that.',
    lobby_full: 'That lobby is full.',
    lobby_not_found: 'No open lobby uses that code.',
    wrong_team_sizes: 'The teams are not the right size for this format.',
    not_member: 'You are not in this duel.',
    round_not_active: 'That round is not open for guesses.',
    already_done: 'You are done with this round.',
    no_guesses_left: 'No guesses left this round.',
    match_over: 'This duel is already over.',
    invalid_config: 'Those duel settings are not valid.',
    not_enough_idols: 'Not enough idols match those filters.',
}

const CODES = Object.keys(MESSAGES)

export function duelErrorCode(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error ?? '')
    return CODES.find((code) => message.includes(code)) ?? ''
}

export function duelErrorMessage(error: unknown): string {
    const code = duelErrorCode(error)
    if (code) return MESSAGES[code]
    if (error instanceof Error && error.message) return error.message
    return 'Something went wrong. Try again.'
}
