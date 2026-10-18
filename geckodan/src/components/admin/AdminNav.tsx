'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/admin/dashboard', label: 'Ringkasan' },
  { href: '/admin/dashboard/geckos', label: 'Geckos' },
  { href: '/admin/dashboard/lines', label: 'Signature lines' },
  { href: '/admin/dashboard/awards', label: 'Prestasi' },
  { href: '/admin/dashboard/testimonials', label: 'Testimoni' },
  { href: '/admin/dashboard/faqs', label: 'FAQ' },
  { href: '/admin/dashboard/settings', label: 'Pengaturan situs' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <ul>
      {LINKS.map((link) => {
        const active = link.href === '/admin/dashboard' ? pathname === link.href : pathname.startsWith(link.href)
        return (
          <li key={link.href}>
            <Link href={link.href} aria-current={active ? 'page' : undefined}>
              {link.label}
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
