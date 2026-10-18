// End-to-end test of the admin and public flows against a LOCAL Supabase stack
// and a running app (`npm run build && npm start`). It creates throwaway users
// and an obviously named test gecko, drives the real UI in Chromium, and
// removes everything it created at the end.
//
//   BASE_URL=http://localhost:3000 npm run test:e2e
//
// Playwright is loaded from PLAYWRIGHT_MODULE when set (for a shared install),
// otherwise from the `playwright` package.

import { execFileSync } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright')

function localEnv() {
  const out = execFileSync('npx', ['supabase', 'status', '-o', 'env'], { encoding: 'utf8' })
  const env = Object.fromEntries(
    out
      .split('\n')
      .map((l) => l.match(/^([A-Z_]+)="?(.*?)"?$/))
      .filter(Boolean)
      .map((m) => [m[1], m[2]]),
  )
  if (!/^http:\/\/(127\.0\.0\.1|localhost)/.test(env.API_URL ?? '')) {
    throw new Error('Refusing to run: this test only runs against a local Supabase stack.')
  }
  return env
}

const env = localEnv()
const service = createClient(env.API_URL, env.SERVICE_ROLE_KEY, { auth: { persistSession: false } })

let passes = 0
let failures = 0
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
const password = `E2e-${stamp}-pw!`
const adminEmail = `e2e-admin-${stamp}@test.local`
const userEmail = `e2e-user-${stamp}@test.local`
const code = `E2E-${String(stamp).slice(-6)}`
const name = `E2E Test Gecko ${String(stamp).slice(-6)}`
const users = []

// A 2x2 PNG, built in memory so the test needs no fixture file.
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGP8z8DAwMDAxMDAwMDAAAANHQEDasKb6QAAAABJRU5ErkJggg==',
  'base64',
)

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
)

async function login(page, email) {
  await page.goto(`${BASE}/admin`)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Kata sandi').fill(password)
  await page.getByRole('button', { name: 'Masuk' }).click()
}

try {
  for (const email of [adminEmail, userEmail]) {
    const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true })
    if (error) throw error
    users.push(data.user.id)
  }
  {
    const { error } = await service.from('admin_users').insert({ user_id: users[0] })
    if (error) throw error
  }

  console.log('Access control')
  {
    const context = await browser.newContext()
    const page = await context.newPage()
    await page.goto(`${BASE}/admin/dashboard/geckos`)
    check('a visitor is sent to the login page', page.url().startsWith(`${BASE}/admin?reason=signin`), page.url())

    await login(page, userEmail)
    await page.getByText('akun tidak memiliki akses admin').waitFor({ timeout: 10000 })
    check('a signed-in non-admin is refused', true)
    await page.goto(`${BASE}/admin/dashboard`)
    check('a non-admin cannot open the dashboard', page.url().startsWith(`${BASE}/admin?reason=signin`), page.url())

    await login(page, 'nobody@test.local')
    await page.getByText('Email atau kata sandi salah').waitFor({ timeout: 10000 })
    check('a wrong login shows a generic error', true)
    await context.close()
  }

  console.log('Admin flow')
  const context = await browser.newContext()
  const page = await context.newPage()
  const consoleErrors = []
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))

  await login(page, adminEmail)
  await page.waitForURL(`${BASE}/admin/dashboard`)
  check('the admin reaches the dashboard', true)

  await page.goto(`${BASE}/admin/dashboard/geckos/new`)
  await page.getByLabel('Nama', { exact: true }).fill(name)
  await page.getByLabel('ID gecko').fill('bad id!')
  await page.getByLabel('ID gecko').evaluate((el) => el.removeAttribute('pattern'))
  await page.getByRole('button', { name: 'Buat gecko' }).click()
  await page.getByText('ID hanya huruf').waitFor({ timeout: 10000 })
  check('server-side validation rejects an invalid ID', (await page.getByLabel('Nama', { exact: true }).inputValue()) === name)

  await page.getByLabel('ID gecko').fill(code)
  await page.getByLabel('Morph').fill('Test morph')
  await page.getByLabel('Status penjualan').selectOption('available')
  await page.getByRole('button', { name: 'Buat gecko' }).click()
  await page.waitForURL(/\/admin\/dashboard\/geckos\/[0-9a-f-]{36}\?created=1/)
  const geckoId = page.url().match(/geckos\/([0-9a-f-]{36})/)[1]
  check('the admin creates a gecko', Boolean(geckoId))

  const { data: draft } = await service.from('geckos').select('slug, published').eq('id', geckoId).single()
  const anonCheck = await fetch(`${BASE}/geckos/${draft.slug}`)
  check('a draft gecko is not public', anonCheck.status === 404, `HTTP ${anonCheck.status}`)

  await page.locator('#upload-photos').setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: png })
  await page.getByRole('button', { name: 'Upload' }).click()
  await page.getByText('1 file tersimpan.').waitFor({ timeout: 15000 })
  await page.locator('.photo-card img').first().waitFor({ timeout: 10000 })
  check('the admin uploads a photo and it becomes the cover', (await page.locator('.photo-card .tag', { hasText: 'Sampul' }).count()) === 1)

  await page.locator('#upload-photos').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('<svg/>') })
  await page.getByRole('button', { name: 'Upload' }).click()
  await page.getByText('bukan gambar').waitFor({ timeout: 15000 })
  check('a fake image is rejected', true)

  await page.getByLabel('Publikasikan di situs').check()
  await page.getByLabel('Tampilkan di beranda (unggulan)').check()
  await page.getByRole('button', { name: 'Simpan perubahan' }).click()
  await page.getByText('Perubahan disimpan.').waitFor({ timeout: 10000 })
  check('the admin publishes the gecko', true)

  console.log('Public site')
  const visitor = await (await browser.newContext()).newPage()
  await visitor.goto(`${BASE}/geckos/${draft.slug}`)
  check('the published gecko page loads', (await visitor.getByRole('heading', { level: 1 }).textContent())?.includes(name))
  const photo = visitor.locator('main img[src*="storage"], main img[src*="_next/image"]').first()
  check('the gecko photo is shown', (await photo.count()) === 1)
  const wa = await visitor.getByRole('main').getByRole('link', { name: 'Ask on WhatsApp' }).getAttribute('href')
  const message = decodeURIComponent(new URL(wa).searchParams.get('text') ?? '')
  check('the WhatsApp link goes to the GeckoDan number', wa.startsWith('https://wa.me/6285174413278'))
  check(
    'the WhatsApp message names the gecko, ID and page',
    message.includes(name) && message.includes(code) && message.includes(`/geckos/${draft.slug}`),
    message,
  )
  const html = await visitor.content()
  check('no price is shown', !/Rp\s?\d|harga:\s*\d/i.test(html))

  await visitor.goto(`${BASE}/geckos?q=${encodeURIComponent(code)}`)
  check('the catalog search finds the gecko', (await visitor.getByText(name).count()) > 0)

  await page.getByRole('button', { name: 'Arsipkan' }).click()
  await page.getByText('Gecko diarsipkan').waitFor({ timeout: 10000 })
  const archived = await fetch(`${BASE}/geckos/${draft.slug}`)
  check('an archived gecko disappears from the site', archived.status === 404, `HTTP ${archived.status}`)

  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Hapus permanen' }).click()
  await page.waitForURL(`${BASE}/admin/dashboard/geckos?deleted=1`)
  const { data: gone } = await service.from('geckos').select('id').eq('id', geckoId)
  const { data: objects } = await service.storage.from('media').list(`geckos/${geckoId}`)
  check('deleting a gecko removes its record and photos', gone.length === 0 && (objects ?? []).length === 0)

  await page.getByRole('button', { name: 'Keluar' }).click()
  await page.waitForURL(/\/admin\?reason=signedout/)
  await page.goto(`${BASE}/admin/dashboard`)
  check('after signing out the dashboard is closed', page.url().startsWith(`${BASE}/admin?reason=signin`))

  check('no console errors in the admin', consoleErrors.length === 0, consoleErrors.join(' | '))
  await context.close()
} catch (err) {
  failures++
  console.error('Unexpected error:', err)
} finally {
  const { data: leftovers } = await service.from('geckos').select('id').like('code', 'E2E-%')
  for (const g of leftovers ?? []) {
    const { data: objects } = await service.storage.from('media').list(`geckos/${g.id}`)
    if (objects?.length) await service.storage.from('media').remove(objects.map((o) => `geckos/${g.id}/${o.name}`))
    await service.from('geckos').delete().eq('id', g.id)
  }
  for (const id of users) await service.auth.admin.deleteUser(id)
  await browser.close()
}

console.log(`\n${passes} passed, ${failures} failed`)
process.exit(failures ? 1 : 0)
