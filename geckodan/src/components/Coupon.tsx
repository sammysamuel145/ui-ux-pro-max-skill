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
    const lines = ['Hello GeckoDan,']
    if (name.trim()) lines.push(`My name is ${name.trim()}.`)
    if (interest.trim()) lines.push(`I am interested in: ${interest.trim()}.`)
    lines.push(message.trim() || 'I would like to ask about the available geckos.')
    return lines.join('\n')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    window.open(whatsappLink(whatsappNumber, compose()), '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="coupon">
      <div className="coupon__left">
        <h2>Ask the breeder directly</h2>
        <p>Fill in a few details and WhatsApp opens with your message. We store nothing from this form.</p>
      </div>
      <form className="coupon__form" onSubmit={onSubmit} action={whatsappLink(whatsappNumber)} method="get" target="_blank">
        <label className="sr-only" htmlFor="coupon-name">
          Name
        </label>
        <input id="coupon-name" name="name" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
        <label className="sr-only" htmlFor="coupon-interest">
          Gecko you are interested in
        </label>
        <input
          id="coupon-interest"
          name="interest"
          placeholder="Gecko or line you are interested in (optional)"
          value={interest}
          onChange={(e) => setInterest(e.target.value)}
          maxLength={120}
        />
        <label className="sr-only" htmlFor="coupon-message">
          Message
        </label>
        <textarea id="coupon-message" name="text" placeholder="Your question" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={800} />
        <button type="submit" className="btn">
          Send via WhatsApp
        </button>
      </form>
    </div>
  )
}
