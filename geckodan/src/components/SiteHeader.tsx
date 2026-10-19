'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { siteUrl } from '@/lib/env'
import { pageInquiryMessage, whatsappLink } from '@/lib/whatsapp'

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
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  // Close the menu after navigating.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Close on Escape (focus returns to the button) and on a tap or click outside.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      menuRef.current?.querySelector('button')?.focus()
    }
    const onPointer = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onPointer)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onPointer)
    }
  }, [open])

  return (
    <header className={`site-header${overlay ? ' is-overlay on-night' : ''}`}>
      <div className="wrap site-header__bar">
        <Link href="/" className="brand-link" aria-label="GeckoDan, home">
          <Image src="/brand/geckodan-logo-256.png" alt="" width={256} height={242} preload />
          <span>GeckoDan</span>
        </Link>
        <nav className="nav-primary" aria-label="Primary">
          {PRIMARY.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrent(pathname, item.href) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="menu" ref={menuRef} data-open={open}>
          <button
            type="button"
            className="menu__button"
            aria-label="Full menu"
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="menu__label">Menu</span>
            <span className="menu__icon" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
          <div
            className="menu__panel on-night"
            id="site-menu"
            // Any link closes the menu, including a link to the page that is already open.
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a')) setOpen(false)
            }}
          >
            <nav aria-label="All pages">
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
              href={whatsappLink(whatsappNumber, pageInquiryMessage(pathname, siteUrl()))}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
