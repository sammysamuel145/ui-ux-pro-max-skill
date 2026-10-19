import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const ID = '11111111-1111-4111-8111-111111111111'
const FILE = '22222222-2222-4222-8222-222222222222'
const PATH = `geckos/${ID}/${FILE}.png`
const PREFIX = `geckos/${ID}/`
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(56).fill(0)])

function fakeSupabase() {
  const remove = vi.fn(async () => ({ error: null }))
  return { client: { storage: { from: () => ({ remove }) } } as never, remove }
}

function respond(init: { status?: number; body?: Uint8Array | ReadableStream; headers?: Record<string, string> }) {
  return new Response((init.body ?? new Uint8Array()) as BodyInit, { status: init.status ?? 206, headers: init.headers })
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54321'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon'
})
afterEach(() => vi.unstubAllGlobals())

describe('verifyStoredImage', () => {
  it('accepts a real image and reads only its first bytes', async () => {
    const { verifyStoredImage } = await import('./admin-helpers')
    const fetchMock = vi.fn(async () => respond({ body: PNG, headers: { 'content-range': 'bytes 0-63/12582912' } }))
    vi.stubGlobal('fetch', fetchMock)
    const { client, remove } = fakeSupabase()
    expect(await verifyStoredImage(client, PATH, PREFIX)).toBeNull()
    expect(remove).not.toHaveBeenCalled()
    const init = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1]
    expect((init.headers as Record<string, string>).Range).toBe('bytes=0-63')
  })

  it('removes a file whose content is not an image, whatever its name says', async () => {
    const { verifyStoredImage } = await import('./admin-helpers')
    vi.stubGlobal('fetch', vi.fn(async () => respond({ body: new TextEncoder().encode('<svg onload=alert(1)>'), headers: { 'content-range': 'bytes 0-20/21' } })))
    const { client, remove } = fakeSupabase()
    expect(await verifyStoredImage(client, PATH, PREFIX)).toMatch(/bukan gambar/)
    expect(remove).toHaveBeenCalledWith([PATH])
  })

  it('removes a file larger than 25 MB', async () => {
    const { verifyStoredImage } = await import('./admin-helpers')
    vi.stubGlobal('fetch', vi.fn(async () => respond({ body: PNG, headers: { 'content-range': `bytes 0-63/${30 * 1024 * 1024}` } })))
    const { client, remove } = fakeSupabase()
    expect(await verifyStoredImage(client, PATH, PREFIX)).toMatch(/lebih dari 25 MB/)
    expect(remove).toHaveBeenCalledWith([PATH])
  })

  it('reports a missing object', async () => {
    const { verifyStoredImage } = await import('./admin-helpers')
    vi.stubGlobal('fetch', vi.fn(async () => respond({ status: 404 })))
    const { client } = fakeSupabase()
    expect(await verifyStoredImage(client, PATH, PREFIX)).toMatch(/tidak ditemukan/)
  })

  it('refuses a path outside the expected folder without fetching or deleting anything', async () => {
    const { verifyStoredImage } = await import('./admin-helpers')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { client, remove } = fakeSupabase()
    expect(await verifyStoredImage(client, `lines/${ID}/${FILE}.png`, PREFIX)).toMatch(/Nama file/)
    expect(await verifyStoredImage(client, '../../etc/passwd', PREFIX)).toMatch(/Nama file/)
    expect(fetchMock).not.toHaveBeenCalled()
    expect(remove).not.toHaveBeenCalled()
  })

  it('stops reading when the server ignores Range and sends the whole file', async () => {
    const { verifyStoredImage } = await import('./admin-helpers')
    let pulled = 0
    const stream = new ReadableStream({
      pull(controller) {
        pulled++
        if (pulled > 50) return controller.close()
        controller.enqueue(pulled === 1 ? PNG : new Uint8Array(1024 * 1024))
      },
    })
    vi.stubGlobal('fetch', vi.fn(async () => respond({ status: 200, body: stream, headers: { 'content-length': String(20 * 1024 * 1024) } })))
    const { client } = fakeSupabase()
    expect(await verifyStoredImage(client, PATH, PREFIX)).toBeNull()
    expect(pulled).toBeLessThan(5)
  })
})
