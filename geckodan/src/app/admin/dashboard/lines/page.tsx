import Link from 'next/link'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { requireAdmin } from '@/lib/admin'
import type { SignatureLine } from '@/lib/types'
import { moveLine } from '../content-actions'

export default async function AdminLinesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireAdmin()
  const [linesRes, geckosRes] = await Promise.all([
    supabase.from('signature_lines').select('*').order('sort_order').order('created_at'),
    supabase.from('geckos').select('line_id').not('line_id', 'is', null).limit(5000),
  ])
  const lines = (linesRes.data ?? []) as SignatureLine[]
  const counts = new Map<string, number>()
  for (const g of (geckosRes.data ?? []) as Array<{ line_id: string }>) counts.set(g.line_id, (counts.get(g.line_id) ?? 0) + 1)
  const deleted = (await searchParams).deleted === '1'

  return (
    <div className="admin-stack">
      <header className="admin-head">
        <h1 className="headline">Signature lines</h1>
        <Link className="btn btn-dark" href="/admin/dashboard/lines/new">
          Line baru
        </Link>
      </header>
      <p className="soft">
        Tambahkan line baru di sini. Line baru berstatus draft sampai kamu menayangkannya. Urutan di bawah dipakai di menu,
        beranda, dan sitemap. Alamat halaman tidak bisa diubah setelah dibuat.
      </p>
      {deleted ? <p className="flash flash--ok">Line dihapus.</p> : null}
      <table className="admin-table">
        <thead>
          <tr>
            <th scope="col">Urutan</th>
            <th scope="col">Line</th>
            <th scope="col">Situs</th>
            <th scope="col">Gecko</th>
            <th scope="col">Sampul</th>
            <th scope="col">Cerita</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={l.id}>
              <td>
                <div className="inline-actions">
                  {i > 0 ? (
                    <ActionForm action={moveLine.bind(null, l.id, 'up')} label={`Naikkan ${l.name}`}>
                      <SubmitButton small variant="btn-quiet">
                        ↑ Naik
                      </SubmitButton>
                    </ActionForm>
                  ) : null}
                  {i < lines.length - 1 ? (
                    <ActionForm action={moveLine.bind(null, l.id, 'down')} label={`Turunkan ${l.name}`}>
                      <SubmitButton small variant="btn-quiet">
                        ↓ Turun
                      </SubmitButton>
                    </ActionForm>
                  ) : null}
                </div>
              </td>
              <td>
                <Link href={`/admin/dashboard/lines/${l.id}`}>{l.name}</Link>
              </td>
              <td>{l.published ? 'Tayang' : 'Draft'}</td>
              <td>{counts.get(l.id) ?? 0}</td>
              <td>{l.cover_photo_path ? 'Ada' : <span className="warn">Belum ada</span>}</td>
              <td>{l.description ? 'Ada' : <span className="warn">Belum ditulis</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
