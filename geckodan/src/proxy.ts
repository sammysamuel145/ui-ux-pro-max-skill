import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Keeps the Supabase session cookie fresh for the admin area and turns away
// visitors without a session before any dashboard page renders. This is only
// a first gate: every dashboard page and Server Action calls requireAdmin(),
// and Row Level Security decides what the database actually allows.
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isDashboard = request.nextUrl.pathname.startsWith('/admin/dashboard')

  if (!url || !anonKey) {
    if (!isDashboard) return NextResponse.next()
    return NextResponse.redirect(new URL('/admin?reason=unconfigured', request.url))
  }

  let response = NextResponse.next({ request })
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options)
      },
    },
  })

  const { data } = await supabase.auth.getUser()
  if (isDashboard && !data.user) {
    const redirect = NextResponse.redirect(new URL('/admin?reason=signin', request.url))
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie)
    return redirect
  }
  return response
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
