import 'server-only'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { supabaseConfig } from '../env'

// Cookie-less client with the anon key for public pages. Row Level Security
// limits it to published content, and pages using it can be cached.
let cached: SupabaseClient | null = null

export function publicClient(): SupabaseClient | null {
  const config = supabaseConfig()
  if (!config) return null
  if (!cached) {
    cached = createClient(config.url, config.anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    })
  }
  return cached
}
