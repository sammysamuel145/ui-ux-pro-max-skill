import Link from 'next/link'
import { GeckoForm } from '@/components/admin/GeckoForm'
import { requireAdmin } from '@/lib/admin'
import { saveGecko } from '../actions'

export default async function NewGeckoPage() {
  const { supabase } = await requireAdmin()
  const [lines, parents] = await Promise.all([
    supabase.from('signature_lines').select('id, name').order('sort_order'),
    supabase.from('geckos').select('id, name, code, sex').order('name').limit(1000),
  ])
  return (
    <div className="admin-stack">
      <p>
        <Link className="text-link" href="/admin/dashboard/geckos">
          Semua gecko
        </Link>
      </p>
      <h1 className="headline">Gecko baru</h1>
      <p className="soft">Foto bisa ditambahkan setelah gecko dibuat.</p>
      <GeckoForm action={saveGecko.bind(null, null)} lines={lines.data ?? []} parents={parents.data ?? []} />
    </div>
  )
}
