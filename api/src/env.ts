import { config } from 'dotenv'
import { resolve } from 'node:path'

config({ path: resolve(process.cwd(), '.env') })
config({ path: resolve(process.cwd(), '../.env') })

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}. Set it in api/.env (see api/.env.example).`)
  }
  return value
}

export const supabaseUrl = required('SUPABASE_URL')
export const supabaseServiceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY')
export const sessionSecret = required('SESSION_SECRET')
export const apiPublicUrl = (process.env.API_PUBLIC_URL || 'http://localhost:4000').replace(
  /\/+$/,
  ''
)
export const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)
export const port = Number(process.env.PORT || 4000)
