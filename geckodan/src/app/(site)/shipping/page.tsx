import type { Metadata } from 'next'
import { PendingContent } from '@/components/Notices'
import { PageHead } from '@/components/PageHead'
import { getSettings, listFaqs } from '@/lib/data/public'
import { paragraphs } from '@/lib/text'
import { whatsappLink } from '@/lib/whatsapp'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Shipping',
  description: 'Informasi pengiriman dan pembelian leopard gecko dari GeckoDan.',
  alternates: { canonical: '/shipping' },
}

export default async function ShippingPage() {
  const [settings, faqs] = await Promise.all([getSettings(), listFaqs('shipping')])
  const body = paragraphs(settings.shipping.body)
  return (
    <>
      <PageHead title="Shipping & Purchase" tagline="Cara membeli dan menerima gecko Anda." />
      <section className="wrap" style={{ display: 'grid', gap: 48, paddingBottom: 'var(--section)' }}>
        <div className="prose measure">
          {body.length ? (
            body.map((p, i) => <p key={i}>{p}</p>)
          ) : (
            <PendingContent>
              Kebijakan pengiriman dan pembelian GeckoDan sedang disiapkan. Untuk saat ini, cara pengiriman dan pembayaran dibicarakan langsung
              lewat WhatsApp.
            </PendingContent>
          )}
        </div>
        {faqs.state === 'ok' && faqs.data.length ? (
          <div className="faq-list" style={{ maxWidth: 820 }}>
            {faqs.data.map((f) => (
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
        ) : null}
        <p>
          <a
            className="btn btn-primary"
            href={whatsappLink(settings.business.whatsapp_number, 'Halo GeckoDan, saya ingin bertanya tentang pengiriman gecko.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Tanya pengiriman via WhatsApp
          </a>
        </p>
      </section>
    </>
  )
}
