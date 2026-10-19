'use client'

import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import { siteUrl } from '@/lib/env'
import { pageInquiryMessage, whatsappLink } from '@/lib/whatsapp'

/**
 * A WhatsApp link whose prefilled message follows the page it is clicked on
 * (a gecko page, a line, the catalog, the FAQ and so on).
 */
export function ContextWhatsAppLink({
  number,
  className,
  children,
  ...rest
}: {
  number: string
  className?: string
  children: ReactNode
  'aria-label'?: string
}) {
  const pathname = usePathname() ?? '/'
  return (
    <a
      className={className}
      href={whatsappLink(number, pageInquiryMessage(pathname, siteUrl()))}
      target="_blank"
      rel="noopener noreferrer"
      {...rest}
    >
      {children}
    </a>
  )
}
