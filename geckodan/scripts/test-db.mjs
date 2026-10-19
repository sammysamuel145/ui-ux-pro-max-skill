// Security tests against a LOCAL Supabase stack (`npx supabase start`).
// It reads the local keys from `supabase status`, creates throwaway users,
// and checks that Row Level Security and Storage policies behave as intended.
// The service-role key is used only here, for test setup, and only for the
// local stack. It is never used by the application.

import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

function localEnv() {
  const out = execFileSync('npx', ['supabase', 'status', '-o', 'env'], { encoding: 'utf8' })
  const env = Object.fromEntries(
    out
      .split('\n')
      .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  )
  if (!env.API_URL || !/^(http:\/\/(127\.0\.0\.1|localhost))/.test(env.API_URL)) {
    throw new Error('Refusing to run: this test only runs against a local Supabase stack.')
  }
  return env
}

const env = localEnv()
const URL_ = env.API_URL
const ANON = env.ANON_KEY
const SERVICE = env.SERVICE_ROLE_KEY

const opts = { auth: { persistSession: false, autoRefreshToken: false } }
const service = createClient(URL_, SERVICE, opts)
const anon = createClient(URL_, ANON, opts)

let failures = 0
let passes = 0
function check(name, ok, detail = '') {
  if (ok) {
    passes++
    console.log(`  ok   ${name}`)
  } else {
    failures++
    console.log(`  FAIL ${name}${detail ? `: ${detail}` : ''}`)
  }
}

const stamp = Date.now()
const adminEmail = `admin-${stamp}@test.local`
const userEmail = `user-${stamp}@test.local`
const password = `Test-${stamp}-pw!`

async function signedIn(email) {
  const client = createClient(URL_, ANON, opts)
  const { error } = await client.auth.signInWithPassword({ email, password })
  if (error) throw error
  return client
}

const created = { users: [], geckos: [], objects: [] }

try {
  console.log('Setup')
  for (const email of [adminEmail, userEmail]) {
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true })
    if (error) throw error
    created.users.push(data.user.id)
  }
  const [adminId] = created.users
  {
    const { error } = await service.from('admin_users').insert({ user_id: adminId })
    if (error) throw error
  }
  const admin = await signedIn(adminEmail)
  const user = await signedIn(userEmail)

  console.log('Public signup')
  {
    const { error } = await anon.auth.signUp({ email: `signup-${stamp}@test.local`, password })
    check('public sign-up is disabled', !!error, error ? '' : 'sign-up succeeded')
  }

  console.log('Admin membership')
  {
    const { error } = await user.from('admin_users').insert({ user_id: created.users[1] })
    check('a signed-in user cannot make themselves admin', !!error)
    const { data } = await user.from('admin_users').select('user_id')
    check('a non-admin sees no admin rows', Array.isArray(data) && data.length === 0)
    const { data: own } = await admin.from('admin_users').select('user_id')
    check('an admin can read their own membership', own?.length === 1)
    const { data: isAdmin } = await admin.rpc('is_admin')
    const { data: isUserAdmin } = await user.rpc('is_admin')
    check('is_admin() is true for the admin and false for a user', isAdmin === true && isUserAdmin === false)
  }

  console.log('Geckos')
  const base = { visibility: 'for_sale', status: 'available', sex: 'unknown' }
  {
    const { error } = await anon.from('geckos').insert({ ...base, code: `T${stamp}A`, slug: `t-${stamp}-a`, name: 'Test anon' })
    check('anon cannot insert a gecko', !!error)
    const { error: e2 } = await user.from('geckos').insert({ ...base, code: `T${stamp}U`, slug: `t-${stamp}-u`, name: 'Test user' })
    check('a non-admin user cannot insert a gecko', !!e2)
  }
  let publishedId, draftId
  {
    const { data, error } = await admin
      .from('geckos')
      .insert([
        { ...base, code: `T${stamp}P`, slug: `t-${stamp}-p`, name: 'Test published', published: true },
        { ...base, code: `T${stamp}D`, slug: `t-${stamp}-d`, name: 'Test draft', published: false },
      ])
      .select('id, code')
    check('an admin can insert geckos', !error && data?.length === 2, error?.message)
    publishedId = data?.find((g) => g.code === `T${stamp}P`)?.id
    draftId = data?.find((g) => g.code === `T${stamp}D`)?.id
    created.geckos.push(publishedId, draftId)
  }
  {
    const { data } = await anon.from('geckos').select('id').in('id', [publishedId, draftId])
    check('anon sees the published gecko only', data?.length === 1 && data[0].id === publishedId)
    const { data: u } = await user.from('geckos').select('id').in('id', [publishedId, draftId])
    check('a non-admin user sees the published gecko only', u?.length === 1)
    const { data: a } = await admin.from('geckos').select('id').in('id', [publishedId, draftId])
    check('an admin sees drafts too', a?.length === 2)
  }
  {
    const { data } = await anon.from('geckos').update({ name: 'hacked' }).eq('id', publishedId).select('id')
    check('anon cannot update a gecko', !data || data.length === 0)
    const { data: d } = await user.from('geckos').delete().eq('id', publishedId).select('id')
    check('a non-admin user cannot delete a gecko', !d || d.length === 0)
    const { data: still } = await service.from('geckos').select('name').eq('id', publishedId).single()
    check('the gecko is unchanged after those attempts', still?.name === 'Test published')
  }
  {
    const { error } = await admin.from('geckos').update({ status: 'reserved' }).eq('id', publishedId)
    check('an admin can change sale status', !error, error?.message)
    const { error: bad } = await admin.from('geckos').insert({ ...base, code: 'bad code!', slug: 'Bad Slug', name: 'x' })
    check('invalid code and slug are rejected by the database', !!bad)
  }
  {
    await admin.from('geckos').update({ archived: true }).eq('id', publishedId)
    const { data } = await anon.from('geckos').select('id').eq('id', publishedId)
    check('an archived gecko disappears from public reads', data?.length === 0)
    await admin.from('geckos').update({ archived: false }).eq('id', publishedId)
  }

  console.log('Prices and typed parents')
  {
    const { data: more, error } = await admin
      .from('geckos')
      .insert([
        { ...base, code: `T${stamp}X`, slug: `t-${stamp}-x`, name: 'Test cheap', published: true, price_idr: 1000000 },
        { ...base, code: `T${stamp}Y`, slug: `t-${stamp}-y`, name: 'Test dear', published: true, price_idr: 9000000 },
        { ...base, code: `T${stamp}Z`, slug: `t-${stamp}-z`, name: 'Test unpriced', published: true },
        { ...base, code: `T${stamp}W`, slug: `t-${stamp}-w`, name: 'Test draft priced', published: false, price_idr: 5000000 },
      ])
      .select('id, code')
    check('an admin can add geckos with and without a price', !error && more?.length === 4, error?.message)
    const idOf = (suffix) => more.find((g) => g.code === `T${stamp}${suffix}`).id
    const [cheap, dear, unpriced, pricedDraft] = [idOf('X'), idOf('Y'), idOf('Z'), idOf('W')]
    created.geckos.push(cheap, dear, unpriced, pricedDraft)

    const { error: zero } = await admin.from('geckos').update({ price_idr: 0 }).eq('id', unpriced)
    const { error: negative } = await admin.from('geckos').update({ price_idr: -5 }).eq('id', unpriced)
    check('a zero or negative price is rejected', !!zero && !!negative)

    const { data: publicRow } = await anon.from('geckos').select('price_idr').eq('id', dear).single()
    check('the price of a published gecko is public', Number(publicRow?.price_idr) === 9000000)
    const { data: draftRow } = await anon.from('geckos').select('price_idr').eq('id', pricedDraft)
    check('the price of a draft gecko stays hidden from the public', draftRow?.length === 0)
    const { data: userChange } = await user.from('geckos').update({ price_idr: 1 }).eq('id', dear).select('id')
    const { data: anonChange } = await anon.from('geckos').update({ price_idr: 1 }).eq('id', dear).select('id')
    check('only an admin can change a price', (!userChange || userChange.length === 0) && (!anonChange || anonChange.length === 0))
    const { data: still } = await service.from('geckos').select('price_idr').eq('id', dear).single()
    check('the price is unchanged after those attempts', Number(still?.price_idr) === 9000000)

    const ours = [cheap, dear, unpriced]
    const sorted = async (ascending) => {
      const { data } = await anon
        .from('geckos')
        .select('id')
        .in('id', ours)
        .order('price_idr', { ascending, nullsFirst: false })
      return (data ?? []).map((g) => g.id)
    }
    const high = await sorted(false)
    const low = await sorted(true)
    check('sorting by price, high to low, puts unpriced last', JSON.stringify(high) === JSON.stringify([dear, cheap, unpriced]), JSON.stringify(high))
    check('and low to high, unpriced still last', JSON.stringify(low) === JSON.stringify([cheap, dear, unpriced]), JSON.stringify(low))

    // Typed parents are plain text on the gecko row.
    const { error: e4 } = await admin.from('geckos').update({ sire_name: 'Big Orange', dam_name: 'Sunny' }).eq('id', cheap)
    const { data: parents } = await anon.from('geckos').select('sire_name, dam_name').eq('id', cheap).single()
    check('typed parents are stored and public', !e4 && parents?.sire_name === 'Big Orange' && parents?.dam_name === 'Sunny')
    const { error: e5 } = await admin.from('geckos').update({ sire_name: 'x'.repeat(121) }).eq('id', cheap)
    check('a parent name over 120 characters is rejected', !!e5)
  }

  console.log('Awards and testimonials')
  {
    const { error } = await admin.from('awards').insert({ title: 'Test award', published: true, verified: false })
    check('an award cannot be published without verification and evidence', !!error)
    const { data, error: e2 } = await admin
      .from('awards')
      .insert({ title: 'Test award ok', published: true, verified: true, evidence_url: 'https://example.com/proof' })
      .select('id')
    check('a verified award with evidence can be published', !e2 && data?.length === 1, e2?.message)
    const { data: pub } = await anon.from('awards').select('id').eq('id', data?.[0]?.id)
    check('anon can read the verified award', pub?.length === 1)
    await admin.from('awards').delete().eq('id', data?.[0]?.id)

    const { error: t1 } = await admin.from('testimonials').insert({ author_name: 'T', body: 'x', published: true })
    check('a testimonial cannot be published without permission', !!t1)
    const { data: t2 } = await admin
      .from('testimonials')
      .insert({ author_name: 'T', body: 'x', published: false, permission_granted: true })
      .select('id')
    const { data: hidden } = await anon.from('testimonials').select('id').eq('id', t2?.[0]?.id)
    check('an unpublished testimonial is hidden from anon', hidden?.length === 0)
    await admin.from('testimonials').delete().eq('id', t2?.[0]?.id)
  }

  console.log('Site settings')
  {
    const { data } = await anon.from('site_settings').select('key')
    check('anon can read public settings', (data?.length ?? 0) >= 5)
    const { data: upd } = await user.from('site_settings').update({ value: {} }).eq('key', 'hero').select('key')
    check('a non-admin cannot change settings', !upd || upd.length === 0)
  }

  console.log('Storage')
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  )
  const path = `geckos/${publishedId}/${crypto.randomUUID()}.png`
  {
    const { error } = await anon.storage.from('media').upload(path, png, { contentType: 'image/png' })
    check('anon cannot upload', !!error)
    const { error: e2 } = await user.storage.from('media').upload(path, png, { contentType: 'image/png' })
    check('a non-admin user cannot upload', !!e2)
    const { error: e3 } = await admin.storage.from('media').upload(path, png, { contentType: 'image/png' })
    check('an admin can upload', !e3, e3?.message)
    created.objects.push(path)
    const { error: e4 } = await admin.storage
      .from('media')
      .upload(`geckos/${publishedId}/${crypto.randomUUID()}.txt`, Buffer.from('x'), { contentType: 'text/plain' })
    check('the bucket rejects non-image files', !!e4)
    // Large photos: the dashboard allows up to 25 MB, and the bucket enforces the same limit.
    const header = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB', 'base64')
    const big = Buffer.concat([header, Buffer.alloc(12 * 1024 * 1024)])
    const bigPath = `geckos/${publishedId}/${crypto.randomUUID()}.png`
    const { error: eBig } = await admin.storage.from('media').upload(bigPath, big, { contentType: 'image/png' })
    created.objects.push(bigPath)
    check('an admin can upload a 12 MB photo', !eBig, eBig?.message)
    const huge = Buffer.concat([header, Buffer.alloc(26 * 1024 * 1024)])
    const hugePath = `geckos/${publishedId}/${crypto.randomUUID()}.png`
    const { error: eHuge } = await admin.storage.from('media').upload(hugePath, huge, { contentType: 'image/png' })
    created.objects.push(hugePath)
    check('the bucket rejects a file over 25 MB', !!eHuge)
    const { error: eUserBig } = await user.storage.from('media').upload(`geckos/${publishedId}/${crypto.randomUUID()}.png`, big, { contentType: 'image/png' })
    check('a non-admin still cannot upload a large file', !!eUserBig)
    const publicUrl = anon.storage.from('media').getPublicUrl(path).data.publicUrl
    const res = await fetch(publicUrl)
    check('an uploaded image is publicly readable by URL', res.ok, `HTTP ${res.status}`)
    const { data: del } = await user.storage.from('media').remove([path])
    const stillThere = (await fetch(publicUrl)).ok
    check('a non-admin user cannot delete media', stillThere && (!del || del.length === 0))
    const { error: e5 } = await admin.from('gecko_photos').insert({ gecko_id: publishedId, storage_path: path, alt: 'test', is_cover: true })
    check('an admin can attach a photo record', !e5, e5?.message)
    const { error: e6 } = await admin
      .from('gecko_photos')
      .insert({ gecko_id: publishedId, storage_path: `geckos/${publishedId}/${crypto.randomUUID()}.png`, alt: 'x', is_cover: true })
    check('only one cover photo per gecko', !!e6)
    const { data: draftPhotos } = await anon.from('gecko_photos').select('id').eq('gecko_id', draftId)
    check('anon cannot list photos of a draft gecko', draftPhotos?.length === 0)
  }
} catch (err) {
  failures++
  console.error('Unexpected error:', err)
} finally {
  if (created.objects.length) await service.storage.from('media').remove(created.objects)
  const ids = created.geckos.filter(Boolean)
  if (ids.length) await service.from('geckos').delete().in('id', ids)
  for (const id of created.users) await service.auth.admin.deleteUser(id)
}

console.log(`\n${passes} passed, ${failures} failed`)
process.exit(failures ? 1 : 0)
