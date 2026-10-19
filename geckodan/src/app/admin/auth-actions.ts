'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { errorState, type ActionState } from '@/lib/action-state'
import { serverClient } from '@/lib/supabase/server'

const credentials = z.object({
  email: z.string().trim().email('Masukkan email yang valid').max(200),
  password: z.string().min(1, 'Masukkan kata sandi').max(200),
})

export async function signIn(formData: FormData): Promise<ActionState> {
  const parsed = credentials.safeParse({ email: formData.get('email'), password: formData.get('password') })
  if (!parsed.success) return errorState(parsed.error.issues[0]?.message ?? 'Data tidak valid')

  const supabase = await serverClient()
  if (!supabase) return errorState('Supabase belum dikonfigurasi di server ini.')

  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  // One message for every failure, so the form does not reveal which emails exist.
  if (error) return errorState('Email atau kata sandi salah, atau akun tidak memiliki akses admin.')

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (isAdmin !== true) {
    await supabase.auth.signOut()
    return errorState('Email atau kata sandi salah, atau akun tidak memiliki akses admin.')
  }
  redirect('/admin/dashboard')
}

export async function signOut() {
  const supabase = await serverClient()
  if (supabase) await supabase.auth.signOut()
  redirect('/admin?reason=signedout')
}
