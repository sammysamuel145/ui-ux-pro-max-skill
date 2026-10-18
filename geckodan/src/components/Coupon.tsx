'use client'

import { useState, type FormEvent } from 'react'
import { whatsappLink } from '@/lib/whatsapp'

/**
 * A clip-out inquiry slip. Nothing is stored or sent to a server: on submit it
 * opens WhatsApp with the visitor's words, which they can still edit.
 */
export function Coupon({ whatsappNumber }: { whatsappNumber: string }) {
  const [name, setName] = useState('')
  const [interest, setInterest] = useState('')
  const [message, setMessage] = useState('')

  const compose = () => {
    const lines = ['Halo GeckoDan,']
    if (name.trim()) lines.push(`Nama saya ${name.trim()}.`)
    if (interest.trim()) lines.push(`Saya tertarik dengan: ${interest.trim()}.`)
    lines.push(message.trim() || 'Saya ingin bertanya tentang gecko yang tersedia.')
    return lines.join('\n')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    window.open(whatsappLink(whatsappNumber, compose()), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="coupon">
      <div className="coupon__left">
        <h2>Tanya langsung ke breeder</h2>
        <p>Isi singkat, lalu WhatsApp terbuka dengan pesan Anda. Tidak ada data yang kami simpan dari formulir ini.</p>
      </div>
      <form className="coupon__form" onSubmit={onSubmit} action={whatsappLink(whatsappNumber)} method="get" target="_blank">
        <label className="sr-only" htmlFor="coupon-name">
          Nama
        </label>
        <input id="coupon-name" name="name" autoComplete="name" placeholder="Nama Anda" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <label className="sr-only" htmlFor="coupon-interest">
          Gecko yang diminati
        </label>
        <input
          id="coupon-interest"
          name="interest"
          placeholder="Gecko atau line yang diminati (opsional)"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          maxLength={120}
        />
        <label className="sr-only" htmlFor="coupon-message">
          Pesan
        </label>
        <textarea id="coupon-message" name="text" placeholder="Pertanyaan Anda" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={800} />
        <button type="submit" className="btn">
          Kirim via WhatsApp
        </button>
      </form>
    </div>
  )
}
