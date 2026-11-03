function UseTestDatabase(): boolean {
    const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV
    if (vercelEnv) return vercelEnv !== 'production'
    return process.env.NODE_ENV !== 'production'
}

function fromTestOrProduction(testValue: string | undefined, productionValue: string | undefined, productionName: string): string {
    if (UseTestDatabase() && testValue) return testValue
    if (!productionValue) throw new Error(`${productionName} is not set`)
    return productionValue
}

export function supabaseUrl(): string {
    return fromTestOrProduction(
        process.env.NEXT_PUBLIC_SUPABASE_URL_TEST,
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        'NEXT_PUBLIC_SUPABASE_URL',
    )
}

export function supabaseAnonKey(): string {
    return fromTestOrProduction(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_TEST,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    )
}
