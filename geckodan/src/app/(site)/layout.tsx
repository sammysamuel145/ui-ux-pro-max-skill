import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { InquiryBar } from '@/components/inquiry/InquiryBar'
import { InquiryProvider } from '@/components/inquiry/InquiryProvider'
import { getSettings, listLines } from '@/lib/data/public'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, lines] = await Promise.all([getSettings(), listLines()])
  return (
    <InquiryProvider whatsappNumber={settings.business.whatsapp_number}>
      <a className="skip-link" href="#main">
        Langsung ke isi
      </a>
      <SiteHeader
        whatsappNumber={settings.business.whatsapp_number}
        lines={lines.state === 'ok' ? lines.data.map((l) => ({ slug: l.slug, name: l.name })) : []}
      />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} />
      <InquiryBar />
    </InquiryProvider>
  )
}
