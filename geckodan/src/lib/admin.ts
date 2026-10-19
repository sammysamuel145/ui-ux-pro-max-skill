import 'server-only'
import { redirect } from 'next/navigation'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { serverClient } from './supabase/server'

export type AdminSession = { supabase: SupabaseClient; user: User }

/**
 * Returns the signed-in admin, or null. Membership is read from admin_users as
 * the user, so Row Level Security decides; the UI never decides on its own.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await serverClient()
  if (!supabase) return null
  const { data: userData, error } = await supabase.auth.getUser()
  if (error || !userData.user) return null
  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) return null
  return { supabase, user: userData.user }
}

/** For admin pages and Server Actions: redirects to the login page otherwise. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession()
  if (!session) redirect('/admin?reason=signin')
  return session
}
