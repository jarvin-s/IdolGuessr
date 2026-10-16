import { createClient } from '@supabase/supabase-js'
import { supabaseServiceRoleKey, supabaseUrl } from './env.js'

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
