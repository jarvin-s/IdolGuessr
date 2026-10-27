export const INFINITE_GEN_VALUES = [2, 3, 4, 5] as const

export const DEFAULT_INFINITE_GEN_FILTER: number[] = [...INFINITE_GEN_VALUES]

export const INFINITE_GEN_OPTIONS: { value: number; label: string }[] =
    INFINITE_GEN_VALUES.map((value) => ({
        value,
        label: `Gen ${value}`,
    }))

export function isValidInfiniteGenFilter(value: unknown): value is number[] {
    return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.every(
            (g) =>
                typeof g === 'number' &&
                (INFINITE_GEN_VALUES as readonly number[]).includes(g)
        )
    )
}

export function formatGenFilter(genFilter?: number[] | null): string {
    if (!genFilter || genFilter.length === 0) return 'All Gens'
    const selected = [...new Set(genFilter)].sort((a, b) => a - b)
    const includesAll = INFINITE_GEN_VALUES.every((gen) => selected.includes(gen))
    if (includesAll) return 'All Gens'
    return selected.map((gen) => `Gen ${gen}`).join(', ')
}

export function isActiveInfiniteGenFilter(genFilter?: number[]): boolean {
    return (
        !!genFilter &&
        genFilter.length > 0 &&
        genFilter.length < INFINITE_GEN_VALUES.length
    )
}
