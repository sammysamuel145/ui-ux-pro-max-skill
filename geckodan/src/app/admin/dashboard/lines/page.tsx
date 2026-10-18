import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import type { SignatureLine } from '@/lib/types'

export default async function AdminLinesPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase.from('signature_lines').select('*').order('sort_order')
  const lines = (data ?? []) as SignatureLine[]
  return (
    <div className="admin-stack">
      <h1 className="headline">Signature lines</h1>
      <p className="soft">Tiga line GeckoDan. Nama dan URL tetap; isi cerita, foto sampul, dan SEO bisa diubah.</p>
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Line</th>
            <th scope="col">Situs</th>
            <th scope="col">Sampul</th>
            <th scope="col">Cerita</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id}>
              <td>
                <Link href={`/admin/dashboard/lines/${l.id}`}>{l.name}</Link>
              </td>
              <td>{l.published ? 'Tayang' : 'Draft'}</td>
              <td>{l.cover_photo_path ? 'Ada' : <span className="warn">Belum ada</span>}</td>
              <td>{l.description ? 'Ada' : <span className="warn">Belum ditulis</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
