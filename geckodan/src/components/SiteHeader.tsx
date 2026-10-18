'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { whatsappLink, generalInquiryMessage } from '@/lib/whatsapp'

const PRIMARY = [
  { href: '/', label: 'Home' },
  { href: '/geckos', label: 'Geckos' },
  { href: '/showcase', label: 'Showcase' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/contact', label: 'Contact' },
]

const ALL = [
  ...PRIMARY.slice(0, 3),
  { href: '/lines/mantra', label: 'MANTRA' },
  { href: '/lines/kafka', label: 'KAFKA' },
  { href: '/lines/valkrie', label: 'VALKRIE' },
  { href: '/our-story', label: 'Our Story' },
  { href: '/achievements', label: 'Achievements' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/faq', label: 'FAQ' },
  { href: '/shipping', label: 'Shipping' },
  { href: '/contact', label: 'Contact' },
]

function isCurrent(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`)
}

export function SiteHeader({ whatsappNumber }: { whatsappNumber: string }) {
  const pathname = usePathname() ?? '/'
  const overlay = pathname === '/'
  const menuRef = useRef<HTMLDetailsElement>(null)

  // Close the menu after navigating, and on Escape.
  useEffect(() => {
    if (menuRef.current) menuRef.current.open = false
  }, [pathname])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && menuRef.current?.open) {
        menuRef.current.open = false
        menuRef.current.querySelector('summary')?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <header className={`site-header${overlay ? ' is-overlay on-night' : ''}`}>
      <div className="wrap site-header__bar">
        <Link href="/" className="brand-link" aria-label="GeckoDan, beranda">
          <Image src="/brand/geckodan-logo-256.png" alt="" width={256} height={242} preload />
          <span>GeckoDan</span>
        </Link>
        <nav className="nav-primary" aria-label="Utama">
          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <details className="menu" ref={menuRef}>
          <summary aria-label="Menu lengkap">
            <span className="menu__label">Menu</span>
            <span className="menu__icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </summary>
          <div className="menu__panel on-night">
            <nav aria-label="Semua halaman">
              <ul>
                {ALL.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <a
              className="btn btn-primary menu__wa"
              href={whatsappLink(whatsappNumber, generalInquiryMessage())}
              target="_blank"
              rel="noopener noreferrer"
            >
              Tanya via WhatsApp
            </a>
          </div>
        </details>
      </div>
    </header>
  )
}
