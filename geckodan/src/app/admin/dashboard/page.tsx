import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'

export default async function DashboardPage() {
  const { supabase } = await requireAdmin()
  const count = async (table: string, filter?: (q: any) => any) => {
    let q = supabase.from(table).select('id', { count: 'exact', head: true })
    if (filter) q = filter(q)
    const { count: n } = await q
    return n ?? 0
  }
  const [total, available, reserved, drafts, noPhoto, awards, testimonials, faqs] = await Promise.all([
    count('geckos', (q) => q.eq('archived', false)),
    count('geckos', (q) => q.eq('archived', false).eq('published', true).eq('status', 'available')),
    count('geckos', (q) => q.eq('archived', false).eq('status', 'reserved')),
    count('geckos', (q) => q.eq('archived', false).eq('published', false)),
    supabase
      .from('geckos')
      .select('id, gecko_photos(id)')
      .eq('archived', false)
      .then(({ data }) => (data ?? []).filter((g: { gecko_photos: unknown[] }) => g.gecko_photos.length === 0).length),
    count('awards', (q) => q.eq('published', true)),
    count('testimonials', (q) => q.eq('published', true)),
    count('faqs', (q) => q.eq('published', true)),
  ])

  const stats = [
    { label: 'Gecko aktif', value: total, href: '/admin/dashboard/geckos' },
    { label: 'Tersedia (publik)', value: available, href: '/admin/dashboard/geckos?status=available' },
    { label: 'Reserved', value: reserved, href: '/admin/dashboard/geckos?status=reserved' },
    { label: 'Draft', value: drafts, href: '/admin/dashboard/geckos?published=0' },
    { label: 'Tanpa foto', value: noPhoto, href: '/admin/dashboard/geckos' },
    { label: 'Prestasi tayang', value: awards, href: '/admin/dashboard/awards' },
    { label: 'Testimoni tayang', value: testimonials, href: '/admin/dashboard/testimonials' },
    { label: 'FAQ tayang', value: faqs, href: '/admin/dashboard/faqs' },
  ]

  return (
    <div className="admin-stack">
      <header className="admin-head">
        <h1 className="headline">Ringkasan</h1>
        <Link className="btn btn-primary" href="/admin/dashboard/geckos/new">
          Tambah gecko
        </Link>
      </header>
      <ul className="admin-grid admin-stats">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="admin-stat">
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <section className="admin-note">
        <h2>Aturan konten</h2>
        <ul>
          <li>Harga tidak pernah ditampilkan di situs. Calon pembeli bertanya lewat WhatsApp.</li>
          <li>Gunakan foto asli gecko GeckoDan saja.</li>
          <li>Prestasi baru tayang setelah diverifikasi dan diberi bukti.</li>
          <li>Testimoni baru tayang setelah pelanggan memberi izin.</li>
        </ul>
      </section>
    </div>
  )
}
