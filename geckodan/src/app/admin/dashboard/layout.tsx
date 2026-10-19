import Image from 'next/image'
import Link from 'next/link'
import { AdminNav } from '@/components/admin/AdminNav'
import { requireAdmin } from '@/lib/admin'
import { signOut } from '../auth-actions'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin()
  return (
    <div className="admin-shell">
      <nav className="admin-nav" aria-label="Menu admin">
        <Link href="/admin/dashboard" className="admin-nav__brand">
          <Image src="/brand/geckodan-logo-256.png" alt="" width={40} height={38} />
          <span>GeckoDan Admin</span>
        </Link>
        <AdminNav />
        <div className="admin-nav__foot">
          <p className="small">{user.email}</p>
          <Link href="/" target="_blank" className="small">
            Lihat situs
          </Link>
          <form action={signOut}>
            <button type="submit" className="btn btn-light btn-sm">
              Keluar
            </button>
          </form>
        </div>
      </nav>
      <main id="main" className="admin-main">
        {children}
      </main>
    </div>
  )
}
