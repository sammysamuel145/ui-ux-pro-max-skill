import type { NextConfig } from 'next'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseHost = supabaseUrl ? new URL(supabaseUrl) : null
// Local Supabase (supabase start) serves images from 127.0.0.1, which next/image
// refuses unless explicitly allowed. Only enabled for a local Supabase URL.
const isLocalSupabase = supabaseHost
  ? ['127.0.0.1', 'localhost'].includes(supabaseHost.hostname)
  : false

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    dangerouslyAllowLocalIP: isLocalSupabase,
    remotePatterns: supabaseHost
      ? [
          {
            protocol: supabaseHost.protocol.replace(':', '') as 'http' | 'https',
            hostname: supabaseHost.hostname,
            port: supabaseHost.port,
            pathname: '/storage/v1/object/public/media/**',
          },
        ]
      : [],
  },
  experimental: {
    // Photo uploads go through Server Actions; files are capped at 8 MB in the app.
    serverActions: { bodySizeLimit: '9mb' },
    proxyClientMaxBodySize: '9mb',
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
    ]
  },
}

export default nextConfig
