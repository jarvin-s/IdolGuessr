import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'
import { sessionSecret } from './env.js'

const key = createHash('sha256').update(sessionSecret).digest()

export type SessionMode = 'daily' | 'history' | 'infinite' | 'hangul' | 'challenge'

export interface SessionPayload {
  kind: 'session'
  v: 1
  mode: SessionMode
  idolId: number
  guessesUsed: number
  maxGuesses: number
  exp: number
  done?: boolean
  won?: boolean
  challengeId?: string
}

export interface ImagePayload {
  kind: 'image'
  path: string
  exp: number
}

export function seal(data: SessionPayload | ImagePayload): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(data), 'utf8'),
    cipher.final(),
  ])
  const tag = cipher.getAuthTag()
  return [iv, encrypted, tag].map((part) => part.toString('base64url')).join('.')
}

export function openToken(token: string): SessionPayload | ImagePayload | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const [ivPart, encryptedPart, tagPart] = parts
    const decipher = createDecipheriv(
      'aes-256-gcm',
      key,
      Buffer.from(ivPart, 'base64url')
    )
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'))
    const json = Buffer.concat([
      decipher.update(Buffer.from(encryptedPart, 'base64url')),
      decipher.final(),
    ]).toString('utf8')
    return JSON.parse(json) as SessionPayload | ImagePayload
  } catch {
    return null
  }
}

export function readSession(token: string): SessionPayload | null {
  const payload = openToken(token)
  if (!payload || payload.kind !== 'session') return null
  if (payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}

export function readImage(token: string): ImagePayload | null {
  const payload = openToken(token)
  if (!payload || payload.kind !== 'image') return null
  if (payload.exp < Math.floor(Date.now() / 1000)) return null
  if (!payload.path || payload.path.includes('..')) return null
  return payload
}
