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

export function isActiveInfiniteGenFilter(genFilter?: number[]): boolean {
    return (
        !!genFilter &&
        genFilter.length > 0 &&
        genFilter.length < INFINITE_GEN_VALUES.length
    )
}
