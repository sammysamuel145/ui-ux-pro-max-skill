import type { ReactNode } from 'react'

export function UnconfiguredNotice() {
  return (
    <div className="notice" role="status">
      <h2>Database not connected</h2>
      <p className="measure">
        This page loads its content from the GeckoDan database. Set NEXT_PUBLIC_SUPABASE_URL and
        NEXT_PUBLIC_SUPABASE_ANON_KEY in the server settings to show the data.
      </p>
    </div>
  )
}

export function ErrorNotice() {
  return (
    <div className="notice" role="alert">
      <h2>Data could not be loaded</h2>
      <p className="measure">Something went wrong while fetching the data. Reload this page, or contact us on WhatsApp.</p>
    </div>
  )
}

export function EmptyNotice({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="notice">
      <h2>{title}</h2>
      <div className="measure">{children}</div>
      {action}
    </div>
  )
}

/** Visible marker for content the owner still has to supply before launch. */
export function PendingContent({ children }: { children: ReactNode }) {
  return (
    <p>
      <span className="placeholder-tag">Content coming soon</span> <span className="soft">{children}</span>
    </p>
  )
}
