import type { ReactNode } from 'react'

export function UnconfiguredNotice() {
  return (
    <div className="notice" role="status">
      <h2>Database belum terhubung</h2>
      <p className="measure">
        Konten halaman ini dimuat dari database GeckoDan. Isi NEXT_PUBLIC_SUPABASE_URL dan
        NEXT_PUBLIC_SUPABASE_ANON_KEY di pengaturan server agar data tampil.
      </p>
    </div>
  )
}

export function ErrorNotice() {
  return (
    <div className="notice" role="alert">
      <h2>Data belum bisa dimuat</h2>
      <p className="measure">Terjadi gangguan saat mengambil data. Muat ulang halaman ini, atau hubungi kami lewat WhatsApp.</p>
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
      <span className="placeholder-tag">Konten menyusul</span> <span className="soft">{children}</span>
    </p>
  )
}
