import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'
import type { Award } from '@/lib/types'

export default async function AdminAwardsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { supabase } = await requireAdmin()
  const { data, error } = await supabase.from('awards').select('*').order('sort_order').order('award_year', { ascending: false })
  const awards = (data ?? []) as Award[]
  const deleted = (await searchParams).deleted === '1'
  return (
    <div className="admin-stack">
      <header className="admin-head">
        <h1 className="headline">Prestasi</h1>
        <Link className="btn btn-primary" href="/admin/dashboard/awards/new">
          Tambah prestasi
        </Link>
      </header>
      <p className="soft">Prestasi hanya tayang setelah ditandai terverifikasi dan memiliki bukti. Jangan masukkan hasil yang belum pasti.</p>
      {deleted ? <p className="flash flash--ok">Prestasi dihapus.</p> : null}
      {error ? (
        <p className="flash flash--error">Data prestasi gagal dimuat.</p>
      ) : awards.length === 0 ? (
        <p>Belum ada prestasi.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Judul</th>
              <th scope="col">Tahun</th>
              <th scope="col">Bukti</th>
              <th scope="col">Situs</th>
            </tr>
          </thead>
          <tbody>
            {awards.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/admin/dashboard/awards/${a.id}`}>{a.title}</Link>
                </td>
                <td>{a.award_year ?? '-'}</td>
                <td>{a.evidence_url || a.evidence_path ? (a.verified ? 'Terverifikasi' : 'Belum diverifikasi') : <span className="warn">Belum ada</span>}</td>
                <td>{a.published ? 'Tayang' : 'Draft'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
