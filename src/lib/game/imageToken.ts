import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'
import { readFileSync } from 'fs'

const TOKEN_VERSION = 1
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
const CATEGORIES = new Set(['boy-group', 'girl-group'])
const SEGMENT = /^[A-Za-z0-9+_=.-]{1,200}$/

interface UnlimitedPath {
    c: string
    g: string
    b: string
    e: number
    v: number
}

let cachedKey: Buffer | null = null

function tokenSecret(): string {
    if (process.env.IMAGE_TOKEN_SECRET) return process.env.IMAGE_TOKEN_SECRET
    if (process.env.NODE_ENV === 'production') return ''
    try {
        const match = readFileSync('.env.local', 'utf8').match(/^IMAGE_TOKEN_SECRET=(.*)$/m)
        return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? ''
    } catch {
        return ''
    }
}

function tokenKey(): Buffer {
    if (cachedKey) return cachedKey
    const secret = tokenSecret()
    if (!secret) throw new Error('IMAGE_TOKEN_SECRET is not set')
    cachedKey = createHash('sha256').update(secret).digest()
    return cachedKey
}

function segment(value: unknown): value is string {
    return typeof value === 'string' && SEGMENT.test(value) && !value.includes('..')
}

export function sealUnlimitedPath(category: string, group: string, bucket: string): string {
    if (!CATEGORIES.has(category) || !segment(group) || !segment(bucket)) {
        throw new Error('Invalid unlimited image path')
    }
    const payload: UnlimitedPath = {
        v: TOKEN_VERSION,
        c: category,
        g: group,
        b: bucket,
        e: Date.now() + TOKEN_TTL_MS,
    }
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', tokenKey(), iv)
    const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(payload), 'utf8'),
        cipher.final(),
    ])
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url')
}

export function openUnlimitedPath(token: string): { category: string; group: string; bucket: string } | null {
    try {
        if (!token || token.length > 2000) return null
        const raw = Buffer.from(token, 'base64url')
        if (raw.length < 29) return null
        const decipher = createDecipheriv('aes-256-gcm', tokenKey(), raw.subarray(0, 12))
        decipher.setAuthTag(raw.subarray(12, 28))
        const parsed = JSON.parse(
            Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8')
        ) as Partial<UnlimitedPath>
        if (parsed.v !== TOKEN_VERSION || typeof parsed.e !== 'number' || parsed.e < Date.now()) return null
        if (!CATEGORIES.has(parsed.c ?? '') || !segment(parsed.g) || !segment(parsed.b)) return null
        return { category: parsed.c as string, group: parsed.g as string, bucket: parsed.b as string }
    } catch {
        return null
    }
}
