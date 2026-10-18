import { describe, expect, it } from 'vitest'
import { checkImage, sniffImageType } from './uploads'

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0])
const jpg = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0])
const webp = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ')
const avif = Uint8Array.from([0, 0, 0, 0x1c, ...new TextEncoder().encode('ftypavif')])

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

describe('checkImage', () => {
  it('ignores a misleading declared type', async () => {
    const fake = new File(['<script>alert(1)</script>'], 'photo.png', { type: 'image/png' })
    expect(typeof (await checkImage(fake))).toBe('string')
  })

  it('accepts a real PNG and picks the extension from the content', async () => {
    const file = new File([png], 'photo.jpg', { type: 'image/jpeg' })
    const result = await checkImage(file)
    expect(typeof result).toBe('object')
    if (typeof result === 'object') expect(result.ext).toBe('png')
  })

  it('rejects files that are too large', async () => {
    const big = new File([new Uint8Array(9 * 1024 * 1024)], 'big.png')
    expect(await checkImage(big)).toMatch(/lebih dari/)
  })
})
