import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

/**
 * Supabase client for use in server-side DB helpers (lib/db/*).
 * Does NOT handle cookie-based auth — use utils/supabase/server.ts for that.
 */
export const supabase = createClient(supabaseUrl, supabaseKey)
