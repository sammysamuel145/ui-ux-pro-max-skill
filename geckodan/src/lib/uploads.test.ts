import { describe, expect, it } from 'vitest'
import { MAX_IMAGE_BYTES } from './media'
import { checkImageFile, sniffImageType, validateStoredImage } from './uploads'

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])
const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ')
const avif = Uint8Array.from([0, 0, 0, 0x1c, ...new TextEncoder().encode('ftypavif')])

const ID = '11111111-1111-4111-8111-111111111111'
const FILE = '22222222-2222-4222-8222-222222222222'

describe('sniffImageType', () => {
  it('recognises the allowed formats by their bytes', () => {
    expect(sniffImageType(png)).toBe('image/png')
    expect(sniffImageType(jpg)).toBe('image/jpeg')
    expect(sniffImageType(webp)).toBe('image/webp')
    expect(sniffImageType(avif)).toBe('image/avif')
  })

  it('rejects other content', () => {
    expect(sniffImageType(new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull()
    expect(sniffImageType(new TextEncoder().encode('GIF89a'))).toBeNull()
    expect(sniffImageType(new Uint8Array())).toBeNull()
  })
})

describe('checkImageFile (browser pre-check)', () => {
  it('ignores a misleading declared type', async () => {
    const fake = new File(['<script>alert(1)</script>'], 'photo.png', { type: 'image/png' })
    expect(typeof (await checkImageFile(fake))).toBe('string')
  })

  it('accepts a real PNG and picks the extension from the content', async () => {
    const result = await checkImageFile(new File([png], 'photo.jpg', { type: 'image/jpeg' }))
    expect(typeof result).toBe('object')
    if (typeof result === 'object') expect(result.ext).toBe('png')
  })

  it('accepts a 12 MB photo but refuses one over the limit', async () => {
    const twelve = new File([png, new Uint8Array(12 * 1024 * 1024)], 'big.png')
    expect(typeof (await checkImageFile(twelve))).toBe('object')
    const tooBig = new File([png, new Uint8Array(MAX_IMAGE_BYTES)], 'huge.png')
    expect(await checkImageFile(tooBig)).toMatch(/lebih dari 25 MB/)
  })
})

describe('validateStoredImage (server check after a direct upload)', () => {
  const okPath = `geckos/${ID}/${FILE}.png`
  const base = { path: okPath, expectedPrefix: `geckos/${ID}/`, head: png, totalBytes: 12 * 1024 * 1024 }

  it('accepts a real image of a normal size in the right folder', () => {
    expect(validateStoredImage(base)).toBeNull()
    expect(validateStoredImage({ ...base, path: `site/hero/${FILE}.jpg`, expectedPrefix: 'site/hero/', head: jpg })).toBeNull()
  })

  it('rejects a path the app would never write or the wrong folder', () => {
    expect(validateStoredImage({ ...base, path: `geckos/${ID}/../x.png` })).toMatch(/Nama file/)
    expect(validateStoredImage({ ...base, path: `other/${FILE}.png` })).toMatch(/Nama file/)
    expect(validateStoredImage({ ...base, path: `geckos/${FILE}/${FILE}.png` })).toMatch(/Nama file/)
    expect(validateStoredImage({ ...base, path: `geckos/${ID}/${FILE}.svg` })).toMatch(/Nama file/)
  })

  it('rejects empty, unknown-size and oversized files', () => {
    expect(validateStoredImage({ ...base, totalBytes: 0 })).toMatch(/kosong/)
    expect(validateStoredImage({ ...base, totalBytes: null })).toMatch(/Ukuran/)
    expect(validateStoredImage({ ...base, totalBytes: MAX_IMAGE_BYTES + 1 })).toMatch(/lebih dari 25 MB/)
    expect(validateStoredImage({ ...base, totalBytes: MAX_IMAGE_BYTES })).toBeNull()
  })

  it('rejects content that is not an image, even with an image name', () => {
    expect(validateStoredImage({ ...base, head: new TextEncoder().encode('<svg onload=alert(1)>') })).toMatch(/bukan gambar/)
  })

  it('rejects a real image stored under a different type name', () => {
    expect(validateStoredImage({ ...base, head: jpg })).toMatch(/tidak cocok/)
  })
})
