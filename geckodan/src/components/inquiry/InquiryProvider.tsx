'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type InquiryItem = { id: string; name: string; code: string; slug: string }

type InquiryContextValue = {
  items: InquiryItem[]
  has: (id: string) => boolean
  toggle: (item: InquiryItem) => void
  clear: () => void
  whatsappNumber: string
}

const InquiryContext = createContext<InquiryContextValue | null>(null)
const STORAGE_KEY = 'geckodan:inquiry'
const MAX_ITEMS = 12

function readStored(): InquiryItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter(
        (v): v is InquiryItem =>
          !!v && typeof v.id === 'string' && typeof v.name === 'string' && typeof v.code === 'string' && typeof v.slug === 'string',
      )
      .slice(0, MAX_ITEMS)
  } catch {
    return []
  }
}

/** The visitor's inquiry list. Stored only in this browser, never sent anywhere except WhatsApp on request. */
export function InquiryProvider({ whatsappNumber, children }: { whatsappNumber: string; children: ReactNode }) {
  const [items, setItems] = useState<InquiryItem[]>([])

  useEffect(() => {
    setItems(readStored())
  }, [])

  const persist = useCallback((next: InquiryItem[]) => {
    setItems(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Private mode or blocked storage: the list still works for this visit.
    }
  }, [])

  const value = useMemo<InquiryContextValue>(
    () => ({
      items,
      has: (id) => items.some((i) => i.id === id),
      toggle: (item) =>
        persist(items.some((i) => i.id === item.id) ? items.filter((i) => i.id !== item.id) : [...items, item].slice(0, MAX_ITEMS)),
      clear: () => persist([]),
      whatsappNumber,
    }),
    [items, persist, whatsappNumber],
  )

  return <InquiryContext.Provider value={value}>{children}</InquiryContext.Provider>
}

export function useInquiry(): InquiryContextValue {
  const ctx = useContext(InquiryContext)
  if (!ctx) throw new Error('useInquiry must be used inside InquiryProvider')
  return ctx
}
