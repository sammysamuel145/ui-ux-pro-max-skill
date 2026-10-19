import Link from 'next/link'
import { AwardForm } from '@/components/admin/AwardForm'
import { requireAdmin } from '@/lib/admin'
import { saveAward } from '../../content-actions'

export default async function NewAwardPage() {
  const { supabase } = await requireAdmin()
  const { data: geckos } = await supabase.from('geckos').select('id, name, code').order('name').limit(1000)
  return (
    <div className="admin-stack">
      <p>
        <Link className="text-link" href="/admin/dashboard/awards">
          Semua prestasi
        </Link>
      </p>
      <h1 className="headline">Prestasi baru</h1>
      <AwardForm action={saveAward.bind(null, null)} geckos={geckos ?? []} />
    </div>
  )
}
