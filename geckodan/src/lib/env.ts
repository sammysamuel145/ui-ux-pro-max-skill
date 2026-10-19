// Public configuration. Only NEXT_PUBLIC_* values are read here; no secret is
// ever needed by this app because Row Level Security protects the data.

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return raw.replace(/\/+$/, '')
}

export type SupabaseConfig = { url: string; anonKey: string }

export function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return { url: url.replace(/\/+$/, ''), anonKey }
}

export function isSupabaseConfigured(): boolean {
  return supabaseConfig() !== null
}
