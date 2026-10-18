import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { InquiryBar } from '@/components/inquiry/InquiryBar'
import { InquiryProvider } from '@/components/inquiry/InquiryProvider'
import { getSettings } from '@/lib/data/public'

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings()
  return (
    <InquiryProvider whatsappNumber={settings.business.whatsapp_number}>
      <a className="skip-link" href="#main">
        Langsung ke isi
      </a>
      <SiteHeader whatsappNumber={settings.business.whatsapp_number} />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} />
      <InquiryBar />
    </InquiryProvider>
  )
}
