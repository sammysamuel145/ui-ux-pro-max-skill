import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { supabaseConfig } from '../env'

// Session-aware client for the admin area. It acts as the signed-in user, so
// every query and upload is still checked by Row Level Security.
export async function serverClient() {
  const config = supabaseConfig()
  if (!config) return null
  const cookieStore = await cookies()
  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options)
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  })
}
