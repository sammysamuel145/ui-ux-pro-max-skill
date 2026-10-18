import Image from 'next/image'
import Link from 'next/link'
import type { SiteSettings } from '@/lib/types'

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/geckos', label: 'Geckos' },
  { href: '/showcase', label: 'Showcase' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/contact', label: 'Contact' },
]

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const { business, hero } = settings
  return (
    <footer className="site-footer on-night">
      <div className="site-footer__bar">
        <Link href="/" className="site-footer__brand">
          <Image src="/brand/geckodan-logo-256.png" alt="" width={40} height={38} />
          <span>{business.brand.toUpperCase()}</span>
        </Link>
        <p className="site-footer__tag">
          {hero.eyebrow || 'Premium Gecko Breeder'} <span aria-hidden="true">|</span> {business.location}
        </p>
        <nav aria-label="Footer">
          <ul>
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href}>{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  )
}
