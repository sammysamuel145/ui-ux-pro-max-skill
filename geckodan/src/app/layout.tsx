import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Marcellus, Montserrat } from 'next/font/google'
import { siteUrl } from '@/lib/env'
import './globals.css'

const marcellus = Marcellus({ subsets: ['latin'], weight: '400', variable: '--font-marcellus', display: 'swap' })
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: '500',
  style: 'italic',
  variable: '--font-cormorant',
  display: 'swap',
})
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-montserrat', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: 'GeckoDan · Premium Leopard Gecko Breeder', template: '%s · GeckoDan' },
  description:
    'GeckoDan, a premium leopard gecko breeder in Pamulang, South Tangerang. Browse available geckos and inquire directly on WhatsApp.',
  applicationName: 'GeckoDan',
  openGraph: { type: 'website', siteName: 'GeckoDan', locale: 'en_US' },
  twitter: { card: 'summary_large_image' },
}

export const viewport: Viewport = {
  themeColor: '#070d05',
  colorScheme: 'light',
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${marcellus.variable} ${cormorant.variable} ${montserrat.variable}`}>
      <body>{children}</body>
    </html>
  )
}
