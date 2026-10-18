import type { Metadata } from 'next'
import { ErrorNotice, PendingContent, UnconfiguredNotice } from '@/components/Notices'
import { PageHead } from '@/components/PageHead'
import { getSettings, listFaqs } from '@/lib/data/public'
import { paragraphs } from '@/lib/text'
import { generalInquiryMessage, whatsappLink } from '@/lib/whatsapp'
import type { Faq } from '@/lib/types'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about buying, caring for and shipping GeckoDan leopard geckos.',
  alternates: { canonical: '/faq' },
}

const GROUPS: Array<{ key: Faq['category']; title: string }> = [
  { key: 'purchase', title: 'Purchase' },
  { key: 'shipping', title: 'Shipping' },
  { key: 'care', title: 'Care' },
  { key: 'general', title: 'General' },
]

export default async function FaqPage() {
  const [settings, res] = await Promise.all([getSettings(), listFaqs()])
  return (
    <>
      <PageHead title="FAQ" tagline="Frequently asked questions." />
      <section className="wrap" style={{ display: 'grid', gap: 56, paddingBottom: 'var(--section)', maxWidth: 900 }}>
        {res.state === 'unconfigured' ? (
          <UnconfiguredNotice />
        ) : res.state === 'error' ? (
          <ErrorNotice />
        ) : res.data.length === 0 ? (
          <PendingContent>GeckoDan is preparing answers to common questions.</PendingContent>
        ) : (
          GROUPS.map((group) => {
            const items = res.data.filter((f) => f.category === group.key)
            if (!items.length) return null
            return (
              <div key={group.key}>
                <h2 className="headline" style={{ fontSize: 'clamp(1.75rem, 1.2rem + 2vw, 2.5rem)' }}>
                  {group.title}
                </h2>
                <div className="faq-list">
                  {items.map((f) => (
                    <details key={f.id} className="faq-item">
                      <summary>{f.question}</summary>
                      <div className="prose">
                        {paragraphs(f.answer).map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )
          })
        )}
        <div>
          <p>Can&rsquo;t find your question here?</p>
          <a
            className="btn btn-primary"
            style={{ marginTop: 16 }}
            href={whatsappLink(settings.business.whatsapp_number, generalInquiryMessage())}
            target="_blank"
            rel="noopener noreferrer"
          >
            Ask on WhatsApp
          </a>
        </div>
      </section>
    </>
  )
}
