import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm'
import { getAdminSession } from '@/lib/admin'
import { isSupabaseConfigured } from '@/lib/env'
import { signIn } from './auth-actions'

const REASONS: Record<string, string> = {
  signin: 'Silakan masuk untuk membuka dashboard.',
  signedout: 'Anda sudah keluar.',
  unconfigured: 'Supabase belum dikonfigurasi di server ini.',
}

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AdminLoginPage({ searchParams }: Props) {
  if (await getAdminSession()) redirect('/admin/dashboard')
  const reasonKey = (await searchParams).reason
  const reason = typeof reasonKey === 'string' ? REASONS[reasonKey] : undefined

  return (
    <main id="main" className="admin-login">
      <div className="admin-login__card">
        <Image src="/brand/geckodan-logo-256.png" alt="GeckoDan" width={96} height={91} />
        <h1 className="headline">Admin</h1>
        <p className="soft">Khusus pemilik GeckoDan. Akun admin dibuat langsung di Supabase, tidak ada pendaftaran publik.</p>
        {reason ? <p className="flash flash--ok">{reason}</p> : null}
        {isSupabaseConfigured() ? (
          <ActionForm action={signIn} className="admin-form" label="Masuk admin">
            <div className="field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="username" required maxLength={200} />
            </div>
            <div className="field">
              <label htmlFor="password">Kata sandi</label>
              <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={200} />
            </div>
            <div>
              <SubmitButton variant="btn-primary">Masuk</SubmitButton>
            </div>
          </ActionForm>
        ) : (
          <p className="flash flash--error">Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY terlebih dahulu.</p>
        )}
        <p>
          <Link className="text-link" href="/">
            Kembali ke situs
          </Link>
        </p>
      </div>
    </main>
  )
}
