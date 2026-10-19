import { createBrowserClient } from '@supabase/ssr'
import { supabaseConfig } from '../env'

/**
 * Browser client for the admin's direct uploads. It uses the signed-in
 * admin's own session and the public anon key, so Storage policies still
 * decide who may write. The service-role key is never involved.
 */
export function browserClient() {
  const config = supabaseConfig()
  if (!config) return null
  return createBrowserClient(config.url, config.anonKey)
}
