const GROUPS_KEY = 'unshuffled-groups'
const DAILY_COMPLETION_KEY = 'unshuffled-daily-completion'

export interface UnshuffledDailyCompletion {
    dailyId: number
    seconds: number
    checks: number
}

export function loadUnshuffledGroups(): string[] {
    if (typeof window === 'undefined') return []
    try {
        const parsed = JSON.parse(localStorage.getItem(GROUPS_KEY) ?? '[]')
        return Array.isArray(parsed)
            ? parsed.filter((name): name is string => typeof name === 'string')
            : []
    } catch {
        return []
    }
}

export function saveUnshuffledGroups(groups: string[]): void {
    if (typeof window === 'undefined') return
    if (groups.length === 0) {
        localStorage.removeItem(GROUPS_KEY)
        return
    }
    localStorage.setItem(GROUPS_KEY, JSON.stringify(groups))
}

export function loadUnshuffledDailyCompletion(
    dailyId: number
): UnshuffledDailyCompletion | null {
    if (typeof window === 'undefined') return null
    try {
        const parsed = JSON.parse(
            localStorage.getItem(DAILY_COMPLETION_KEY) ?? 'null'
        ) as Partial<UnshuffledDailyCompletion> | null
        if (
            parsed?.dailyId !== dailyId ||
            typeof parsed.seconds !== 'number' ||
            typeof parsed.checks !== 'number'
        ) {
            return null
        }
        return {
            dailyId: parsed.dailyId,
            seconds: parsed.seconds,
            checks: parsed.checks,
        }
    } catch {
        return null
    }
}

export function saveUnshuffledDailyCompletion(
    completion: UnshuffledDailyCompletion
): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(DAILY_COMPLETION_KEY, JSON.stringify(completion))
}
