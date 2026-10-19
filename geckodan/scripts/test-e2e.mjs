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

  const photosInput = page.locator('section[aria-labelledby="photos-title"] input[type=file]')
  await photosInput.setInputFiles({ name: 'test.png', mimeType: 'image/png', buffer: png })
  await page.getByRole('button', { name: 'Upload' }).click()
  await page.getByText('1 file tersimpan.').waitFor({ timeout: 15000 })
  await page.locator('.photo-card img').first().waitFor({ timeout: 10000 })
  check('the admin uploads a photo and it becomes the cover', (await page.locator('.photo-card .tag', { hasText: 'Sampul' }).count()) === 1)

  await photosInput.setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('<svg/>') })
  await page.getByRole('button', { name: 'Upload' }).click()
  await page.getByText('bukan gambar').waitFor({ timeout: 15000 })
  check('a fake image is rejected', true)

  // A real photo well above the old 8 MB limit goes straight to Storage and is recorded.
  const sharp = (await import('sharp')).default
  const bigPng = await sharp({ create: { width: 2400, height: 2400, channels: 3, noise: { type: 'gaussian', mean: 128, sigma: 60 } } }).png({ compressionLevel: 1 }).toBuffer()
  check('the test photo is bigger than the old 8 MB limit', bigPng.length > 9 * 1024 * 1024, `${(bigPng.length / 1048576).toFixed(1)} MB`)
  await photosInput.setInputFiles({ name: 'big.png', mimeType: 'image/png', buffer: bigPng })
  await page.getByRole('button', { name: 'Upload' }).click()
  await page.getByText('1 file tersimpan.').waitFor({ timeout: 60000 })
  const stored = await service.storage.from('media').list(`geckos/${geckoId}`)
  const sizes = (stored.data ?? []).map((o) => o.metadata?.size ?? 0)
  check('a photo over 8 MB is stored with its full size', sizes.some((n) => n === bigPng.length), sizes.join(', '))
  check('the large photo is listed in the dashboard', (await page.locator('.photo-card').count()) === 2)

  // Over the 25 MB limit: refused in the browser before anything is uploaded.
  await photosInput.setInputFiles({ name: 'huge.png', mimeType: 'image/png', buffer: Buffer.concat([png, Buffer.alloc(26 * 1024 * 1024)]) })
  await page.getByRole('button', { name: 'Upload' }).click()
  await page.getByText('lebih dari 25 MB').waitFor({ timeout: 15000 })
  check('a file over 25 MB is refused', ((await service.storage.from('media').list(`geckos/${geckoId}`)).data ?? []).length === stored.data.length)

  // A file that passes the browser check but is swapped for non-image bytes on the way to Storage:
  // the server must notice, refuse it, and delete it.
  await page.route('**/storage/v1/object/media/**', (route) => {
    const body = route.request().postDataBuffer()
    const at = body ? body.indexOf(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) : -1
    if (!body || at < 0) return route.continue()
    const tampered = Buffer.from(body)
    Buffer.from('<svg    ').copy(tampered, at)
    return route.continue({ postData: tampered })
  })
  await photosInput.setInputFiles({ name: 'tampered.png', mimeType: 'image/png', buffer: png })
  await page.getByRole('button', { name: 'Upload' }).click()
  await page.getByText('Isi file bukan gambar').waitFor({ timeout: 20000 })
  await page.unroute('**/storage/v1/object/media/**')
  const after = (await service.storage.from('media').list(`geckos/${geckoId}`)).data ?? []
  check('a file swapped for non-image bytes is refused by the server', true)
  check('and it is deleted from Storage, not left behind', after.length === stored.data.length, `${after.length} objects, expected ${stored.data.length}`)
  check('the tampered file was never recorded for the gecko', (await service.from('gecko_photos').select('id').eq('gecko_id', geckoId)).data.length === 2)

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
  check('a gecko with no price shows none', !/Rp\s?\d|harga:\s*\d/i.test(html))

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

  console.log('Site-wide pictures')
  await page.goto(`${BASE}/admin/dashboard/settings`)
  const sec = (id) => page.locator(`section[aria-labelledby="${id}"]`)
  const homeImgs = async (sel) => {
    const v = await ctx2.newPage()
    await v.goto(`${BASE}/`)
    await v.locator(sel).first().scrollIntoViewIfNeeded().catch(() => undefined)
    await v.waitForFunction((q) => [...document.querySelectorAll(q)].every((e) => e.complete), sel, { timeout: 20000 }).catch(() => undefined)
    const info = await v.locator(sel).evaluateAll((els) => els.map((e) => ({ src: e.currentSrc || e.src, ok: e.complete && e.naturalWidth > 0, alt: e.alt })))
    const og = await v.locator('meta[property="og:image"]').first().getAttribute('content')
    await v.close()
    return { info, og }
  }
  const ctx2 = await browser.newContext()

  await sec('story-image-title').locator('input[type=text]').fill('Test breeder photo')
  await sec('story-image-title').locator('input[type=file]').setInputFiles({ name: 'story.png', mimeType: 'image/png', buffer: png })
  await sec('story-image-title').getByRole('button', { name: 'Upload' }).click()
  await sec('story-image-title').getByText('1 file tersimpan.').waitFor({ timeout: 60000 })
  let h = await homeImgs('.story__photo img')
  check('the Our Story photo appears on the home page', h.info.length === 1 && /storage/.test(decodeURIComponent(h.info[0].src)) && h.info[0].ok && h.info[0].alt === 'Test breeder photo', JSON.stringify(h.info.map((i) => ({ ok: i.ok, alt: i.alt }))))
  const v2 = await ctx2.newPage()
  await v2.goto(`${BASE}/our-story`)
  check('and on the Our Story page', (await v2.locator('.letter__photo img').count()) === 1)
  await v2.close()

  await sec('og-image-title').locator('input[type=file]').setInputFiles({ name: 'share.png', mimeType: 'image/png', buffer: png })
  await sec('og-image-title').getByRole('button', { name: 'Upload' }).click()
  await sec('og-image-title').getByText('1 file tersimpan.').waitFor({ timeout: 30000 })
  h = await homeImgs('.hero img')
  check('the share image is used for link previews (og:image)', /storage\/v1\/object\/public\/media\/site\/og\//.test(h.og ?? ''), h.og)

  await sec('hero-image-title').locator('input[type=text]').fill('Test hero photo')
  await sec('hero-image-title').locator('input[type=file]').setInputFiles({ name: 'hero.png', mimeType: 'image/png', buffer: png })
  await sec('hero-image-title').getByRole('button', { name: 'Upload' }).click()
  await sec('hero-image-title').getByText('1 file tersimpan.').waitFor({ timeout: 30000 })
  h = await homeImgs('.hero__media img')
  check('an uploaded hero photo replaces the bundled hero image', h.info.length === 1 && /storage/.test(decodeURIComponent(h.info[0].src)))

  // Removing each one restores the placeholder, and the old files are deleted.
  page.on('dialog', (d) => d.accept())
  await sec('hero-image-title').getByRole('button', { name: 'Kembali ke gambar bawaan' }).click()
  await sec('hero-image-title').locator('.photo-card').waitFor({ state: 'detached', timeout: 15000 })
  await sec('story-image-title').getByRole('button', { name: 'Hapus foto' }).click()
  await sec('story-image-title').locator('.photo-card').waitFor({ state: 'detached', timeout: 15000 })
  await sec('og-image-title').getByRole('button', { name: 'Hapus gambar' }).click()
  await sec('og-image-title').locator('.photo-card').waitFor({ state: 'detached', timeout: 15000 })
  h = await homeImgs('.story__photo img')
  check('after removal the story photo and og:image return to their defaults', h.info.every((i) => !/site\/story/.test(decodeURIComponent(i.src))) && /geckodan-logo/.test(decodeURIComponent(h.og ?? '')), JSON.stringify({ srcs: h.info.map((i) => i.src), og: h.og }))
  const left = []
  for (const folder of ['site/hero', 'site/story', 'site/og']) left.push(...((await service.storage.from('media').list(folder)).data ?? []).filter((o) => o.name !== '.emptyFolderPlaceholder'))
  check('the removed site pictures are deleted from Storage', left.length === 0, left.map((o) => o.name).join(','))
  await ctx2.close()

  console.log('Parents, prices and the catalogue controls')
  {
  const tag = String(stamp).slice(-6)
    // The success message of an earlier save stays on screen, so wait for the button to finish instead.
    const save = async () => {
      await page.getByRole('button', { name: 'Simpan perubahan' }).click()
      await page.waitForTimeout(200)
      await page.waitForFunction(() => !document.querySelector('button[aria-busy="true"]'), null, { timeout: 15000 })
    }
  const fetchHtml = async (path) => (await fetch(`${BASE}${path}`)).text()
  const listedName = `E2E Listed Sire ${tag}`
  const listedCode = `E2E-LS${tag}`
  const parentsName = `E2E Parents ${tag}`

  // A gecko with parents typed by hand and a private price.
  await page.goto(`${BASE}/admin/dashboard/geckos/new`)
  await page.getByLabel('Nama', { exact: true }).fill(parentsName)
  await page.getByLabel('ID gecko').fill(`E2E-PA${tag}`)
  await page.getByLabel('Induk jantan (sire)').fill(`Wild Sire ${tag}`)
  await page.getByLabel('Induk betina (dam)').fill(`Wild Dam ${tag}`)
  await page.getByLabel('Harga (Rp)').fill('Rp 2.500.000')
  await page.getByLabel('Publikasikan di situs').check()
  await page.getByRole('button', { name: 'Buat gecko' }).click()
  await page.waitForURL(/\/admin\/dashboard\/geckos\/[0-9a-f-]{36}\?created=1/)
  const parentsId = page.url().match(/geckos\/([0-9a-f-]{36})/)[1]
  const { data: typed } = await service.from('geckos').select('slug, sire_id, sire_name, dam_id, dam_name').eq('id', parentsId).single()
  check('parents can be typed as free text', typed.sire_name === `Wild Sire ${tag}` && typed.dam_name === `Wild Dam ${tag}` && typed.sire_id === null && typed.dam_id === null, JSON.stringify(typed))
  const { data: storedPrice } = await service.from('geckos').select('price_idr').eq('id', parentsId).single()
  check('the price is stored as a number', Number(storedPrice?.price_idr) === 2500000)
  check('the form shows the typed parents and the price again', (await page.getByLabel('Induk jantan (sire)').inputValue()) === `Wild Sire ${tag}` && (await page.getByLabel('Harga (Rp)').inputValue()) === '2500000')
  const typedPage = await fetchHtml(`/geckos/${typed.slug}`)
  check('the typed parents show on the public page', typedPage.includes(`Wild Sire ${tag}`) && typedPage.includes(`Wild Dam ${tag}`))
  check('the price is shown on the public page', typedPage.includes('Rp 2.500.000'))

  // Typing the name or ID of a listed gecko links the parent to it.
  const { data: listed } = await service
    .from('geckos')
    .insert({ code: listedCode, slug: `e2e-listed-sire-${tag}`, name: listedName, sex: 'male', published: true })
    .select('id')
    .single()
  await page.getByLabel('Induk jantan (sire)').fill(listedName)
  await page.getByLabel('Induk betina (dam)').fill(listedCode.toLowerCase())
  await save()
  const { data: linked } = await service.from('geckos').select('sire_id, sire_name, dam_id, dam_name').eq('id', parentsId).single()
  check('a typed name links the parent to the listed gecko', linked.sire_id === listed.id && linked.sire_name === null, JSON.stringify(linked))
  check('a typed ID links too, whatever its letter case', linked.dam_id === listed.id && linked.dam_name === null)
  check('the linked parent shows its current name on the form', (await page.getByLabel('Induk jantan (sire)').inputValue()) === listedName)
  const linkedPage = await fetchHtml(`/geckos/${typed.slug}`)
  check('the public page links to the listed parent', linkedPage.includes(`href="/geckos/e2e-listed-sire-${tag}"`))

  // A gecko cannot be its own parent.
  await page.getByLabel('Induk jantan (sire)').fill(parentsName)
  await page.getByRole('button', { name: 'Simpan perubahan' }).click()
  await page.getByText('tidak bisa menjadi induknya sendiri').waitFor({ timeout: 10000 })
  const { data: afterSelf } = await service.from('geckos').select('sire_id').eq('id', parentsId).single()
  check('a gecko cannot be its own parent', afterSelf.sire_id === listed.id)

  // An invalid price is refused, and clearing the price removes it.
  await page.getByLabel('Induk jantan (sire)').fill(listedName)
  await page.getByLabel('Harga (Rp)').fill('dua juta')
  await page.getByRole('button', { name: 'Simpan perubahan' }).click()
  await page.getByText('Harga hanya boleh angka').waitFor({ timeout: 10000 })
  const { data: keep } = await service.from('geckos').select('price_idr').eq('id', parentsId).single()
  check('an invalid price is refused and the old one stays', Number(keep?.price_idr) === 2500000)

  // A sold gecko shows no price; clearing the price removes it.
  await page.getByLabel('Harga (Rp)').fill('2.500.000')
  await page.getByLabel('Status penjualan').selectOption('sold')
  await save()
  check('a sold gecko shows no price', !(await fetchHtml(`/geckos/${typed.slug}`)).includes('Rp 2.500.000'))
  await page.getByLabel('Status penjualan').selectOption('available')
  await page.getByLabel('Harga (Rp)').fill('')
  await save()
  const { data: cleared } = await service.from('geckos').select('price_idr').eq('id', parentsId).single()
  const clearedPage = []
  for (let i = 0; i < 6; i++) {
    const body = await fetchHtml(`/geckos/${typed.slug}`)
    clearedPage.push(body.includes('Rp 2.500.000') ? 'price' : 'clean')
    if (clearedPage.at(-1) === 'clean') break
    await new Promise((r) => setTimeout(r, 1500))
  }
  check('clearing the price removes it from the record and the page', cleared.price_idr === null && clearedPage.at(-1) === 'clean', JSON.stringify({ db: cleared.price_idr, page: clearedPage }))
  await page.getByLabel('Harga (Rp)').fill('2.500.000')
  await save()

  // The catalogue has search and sort only.
  await page.goto(`${BASE}/geckos`)
  check('the catalogue has no line, status or sex filter', (await page.locator('#line, #status, #sex').count()) === 0)
  check('it keeps the search box', (await page.locator('#q').count()) === 1)
  const sortLabels = await page.locator('#sort option').allTextContents()
  check('sort offers newest, oldest and both price orders', JSON.stringify(sortLabels) === JSON.stringify(['Newest', 'Oldest', 'Price: high to low', 'Price: low to high']), sortLabels.join(' | '))
  await page.goto(`${BASE}/geckos?line=mantra`)
  check('a line chosen through a link survives the Apply button', (await page.locator('form.filters input[name="line"]').getAttribute('value')) === 'mantra')

  // Each sort order, with known prices. Unpriced geckos come last in both price orders.
  const mk = async (name, code, price) => {
    await service.from('geckos').insert({ code, slug: code.toLowerCase(), name, published: true, price_idr: price })
  }
  await mk(`E2E Cheap ${tag}`, `E2E-CH${tag}`, 1000000)
  await mk(`E2E Dear ${tag}`, `E2E-DE${tag}`, 9000000)
  const names = [`E2E Dear ${tag}`, parentsName, `E2E Cheap ${tag}`, listedName]
  const orderOf = async (sort) => {
    const body = await fetchHtml(`/geckos?q=${tag}&sort=${sort}`)
    return names.map((n) => [n, body.indexOf(n)]).filter(([, i]) => i >= 0).sort((a, b) => a[1] - b[1]).map(([n]) => n)
  }
  const expect = (list) => JSON.stringify(list)
  const cheap = `E2E Cheap ${tag}`
  const dear = `E2E Dear ${tag}`
  check('price: high to low', expect(await orderOf('price-high')) === expect([dear, parentsName, cheap, listedName]))
  check('price: low to high', expect(await orderOf('price-low')) === expect([cheap, parentsName, dear, listedName]))
  check('newest first', expect(await orderOf('newest')) === expect([dear, cheap, listedName, parentsName]))
  check('oldest first', expect(await orderOf('oldest')) === expect([parentsName, listedName, cheap, dear]))
  const sorted = await fetchHtml(`/geckos?q=${tag}&sort=price-high`)
  check('the catalogue shows each price', ['Rp 9.000.000', 'Rp 2.500.000', 'Rp 1.000.000'].every((v) => sorted.includes(v)))
  }

  console.log('Signature lines')
  const lineName = `E2E Orion ${String(stamp).slice(-6)}`
  const lineSlug = lineName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const text = async (path) => (await fetch(`${BASE}${path}`)).text()
  const lineLink = `href="/lines/${lineSlug}"`
  const { data: beforeLines } = await service.from('signature_lines').select('id, sort_order').order('sort_order')

  await page.goto(`${BASE}/admin/dashboard/lines`)
  await page.getByRole('link', { name: 'Line baru' }).click()
  await page.waitForURL('**/admin/dashboard/lines/new')
  await page.getByLabel('Nama line').fill(lineName)
  await page.getByRole('button', { name: 'Buat line' }).click()
  await page.waitForURL(/\/admin\/dashboard\/lines\/[0-9a-f-]{36}\?created=1/)
  const lineId = page.url().match(/lines\/([0-9a-f-]{36})/)[1]
  check('the admin adds a new signature line', Boolean(lineId))
  await page.getByText('Line dibuat sebagai draft').waitFor({ timeout: 10000 })

  const { data: created } = await service.from('signature_lines').select('slug, name, published, sort_order').eq('id', lineId).single()
  const maxBefore = Math.max(...(beforeLines ?? []).map((l) => l.sort_order))
  check('its address is made from the name', created.slug === lineSlug, created.slug)
  check('it starts as a draft at the end of the order', created.published === false && created.sort_order === maxBefore + 1, JSON.stringify(created))
  check('a draft line has no public page', (await fetch(`${BASE}/lines/${lineSlug}`)).status === 404)
  check('and is not in the menu or sitemap', !(await text('/')).includes(lineLink) && !(await text('/sitemap.xml')).includes(`/lines/${lineSlug}`))

  await page.getByLabel('Tagline').fill('Test tagline')
  await page.getByLabel('Deskripsi', { exact: true }).fill('Test story of the new line.')
  await page.getByLabel('Tampilkan halaman line di situs').check()
  await page.getByRole('button', { name: 'Simpan line' }).click()
  await page.getByText('Line disimpan.').waitFor({ timeout: 10000 })

  const home = await text('/')
  check('a published line has a public page', (await fetch(`${BASE}/lines/${lineSlug}`)).status === 200)
  check('it appears in the menu', home.includes(lineLink))
  check('it appears among the signature lines on the home page', home.includes(lineName))
  check('it appears in the sitemap', (await text('/sitemap.xml')).includes(`/lines/${lineSlug}`))
  check('the old lines are still in the menu', ['mantra', 'kafka', 'valkrie'].every((slug) => home.includes(`href="/lines/${slug}"`)))

  // Renaming changes the name shown everywhere, never the address.
  const renamed = `${lineName} Prime`
  await page.goto(`${BASE}/admin/dashboard/lines/${lineId}`)
  await page.getByLabel('Nama line').fill('')
  await page.getByLabel('Nama line').evaluate((el) => el.removeAttribute('required'))
  await page.getByRole('button', { name: 'Simpan line' }).click()
  await page.getByText('Nama wajib diisi').waitFor({ timeout: 10000 })
  const { data: unchanged } = await service.from('signature_lines').select('name').eq('id', lineId).single()
  check('a line cannot be saved without a name', unchanged.name === lineName)
  await page.getByLabel('Nama line').fill(renamed)
  await page.getByRole('button', { name: 'Simpan line' }).click()
  await page.getByText('Line disimpan.').waitFor({ timeout: 10000 })
  const { data: renamedRow } = await service.from('signature_lines').select('name, slug, published').eq('id', lineId).single()
  check('a line can be renamed without changing its address', renamedRow.name === renamed && renamedRow.slug === lineSlug && renamedRow.published === true, JSON.stringify(renamedRow))
  const homeRenamed = await text('/')
  check('the new name shows in the menu and on the home page', homeRenamed.includes(renamed) && homeRenamed.includes(lineLink))
  check('the old address still works and shows the new name', (await fetch(`${BASE}/lines/${lineSlug}`)).status === 200 && (await text(`/lines/${lineSlug}`)).includes(renamed))

  // A second line with the same name would reuse the address: refuse it.
  await page.goto(`${BASE}/admin/dashboard/lines/new`)
  await page.getByLabel('Nama line').fill(lineName)
  await page.getByRole('button', { name: 'Buat line' }).click()
  await page.getByText('Slug sudah dipakai').waitFor({ timeout: 10000 })
  check('a duplicate address is refused', true)

  // Moving it up changes the order the public pages use.
  await page.goto(`${BASE}/admin/dashboard/lines`)
  const row = page.locator('tr', { hasText: renamed })
  await row.getByRole('button', { name: /Naik/ }).click()
  await page.getByText('Urutan diubah.').waitFor({ timeout: 10000 })
  const { data: afterMove } = await service.from('signature_lines').select('id, sort_order').order('sort_order')
  const order = (afterMove ?? []).map((l) => l.id)
  check('moving a line up changes its place in the order', order.indexOf(lineId) === order.length - 2)
  check('the order stays numbered 1..n', (afterMove ?? []).every((l, i) => l.sort_order === i + 1))
  const menuAfter = await text('/')
  check('the menu follows the new order', menuAfter.indexOf(lineLink) < menuAfter.indexOf('href="/lines/valkrie"'))

  // A line that still has a gecko cannot be deleted.
  const { data: lineGecko } = await service
    .from('geckos')
    .insert({ code: `E2E-LN${String(stamp).slice(-4)}`, slug: `e2e-line-gecko-${String(stamp).slice(-6)}`, name: `E2E Line Gecko ${String(stamp).slice(-6)}`, line_id: lineId })
    .select('id')
    .single()
  await page.goto(`${BASE}/admin/dashboard/lines/${lineId}`)
  await page.getByRole('button', { name: 'Hapus line' }).click()
  await page.getByText('masih dipakai 1 gecko').waitFor({ timeout: 10000 })
  const { data: still } = await service.from('signature_lines').select('id').eq('id', lineId)
  check('a line that still has geckos is not deleted', still?.length === 1)
  const { data: keep } = await service.from('geckos').select('line_id').eq('id', lineGecko.id).single()
  check('and its gecko keeps the line', keep.line_id === lineId)

  // Once empty it can go, and it disappears everywhere.
  await service.from('geckos').delete().eq('id', lineGecko.id)
  await page.goto(`${BASE}/admin/dashboard/lines/${lineId}`)
  await page.getByRole('button', { name: 'Hapus line' }).click()
  await page.waitForURL('**/admin/dashboard/lines?deleted=1')
  const { data: lineGone } = await service.from('signature_lines').select('id').eq('id', lineId)
  check('an empty line can be deleted', lineGone?.length === 0)
  // A cached page can be served once more while it refreshes, so allow a few seconds.
  const statuses = []
  for (let i = 0; i < 15 && statuses.at(-1) !== 404; i++) {
    if (i) await new Promise((r) => setTimeout(r, 2000))
    statuses.push((await fetch(`${BASE}/lines/${lineSlug}`)).status)
  }
  const goneStatus = statuses.at(-1)
  const goneInMenu = !(await text('/')).includes(lineLink)
  const goneInSitemap = !(await text('/sitemap.xml')).includes(`/lines/${lineSlug}`)
  check('its page, menu entry and sitemap entry are gone', goneStatus === 404 && goneInMenu && goneInSitemap, JSON.stringify({ pageStatuses: statuses, menuClean: goneInMenu, sitemapClean: goneInSitemap }))
  const { data: afterDelete } = await service.from('signature_lines').select('slug').order('sort_order')
  check('the three original lines are untouched', ['mantra', 'kafka', 'valkrie'].every((slug) => (afterDelete ?? []).some((l) => l.slug === slug)))

  await page.getByRole('button', { name: 'Keluar' }).click()
  await page.waitForURL(/\/admin\?reason=signedout/)
  await page.goto(`${BASE}/admin/dashboard`)
  check('after signing out the dashboard is closed', page.url().startsWith(`${BASE}/admin?reason=signin`))

  check('no console errors in the admin', consoleErrors.length === 0, consoleErrors.join(' | '))
  await context.close()
} catch (err) {
  failures++
  console.error('Unexpected error:', err)
  for (const p of browser.contexts().flatMap((c) => c.pages())) {
    const flashes = await p.locator('.flash').allTextContents().catch(() => [])
    if (flashes.length) console.error('Page messages:', flashes.join(' | '))
  }
} finally {
  const { data: leftovers } = await service.from('geckos').select('id').like('code', 'E2E-%')
  for (const g of leftovers ?? []) {
    const { data: objects } = await service.storage.from('media').list(`geckos/${g.id}`)
    if (objects?.length) await service.storage.from('media').remove(objects.map((o) => `geckos/${g.id}/${o.name}`))
    await service.from('geckos').delete().eq('id', g.id)
  }
  await service.from('signature_lines').delete().like('slug', 'e2e-%')
  for (const id of users) await service.auth.admin.deleteUser(id)
  await browser.close()
}

console.log(`\n${passes} passed, ${failures} failed`)
process.exit(failures ? 1 : 0)
