'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import type { ActionState } from '@/lib/action-state'
import { MAX_IMAGE_MB } from '@/lib/media'
import { browserClient } from '@/lib/supabase/browser'
import { checkImageFile } from '@/lib/uploads'

type Props = {
  /** Storage folder the photos go into, for example `geckos/<id>`. */
  folder: string
  /** Server action that verifies the stored file and records it. */
  attach: (path: string, alt: string) => Promise<ActionState>
  multiple?: boolean
  label?: string
  withAlt?: boolean
}

/**
 * Uploads each photo straight from the browser to Storage, as the signed-in
 * admin (Storage policies still decide who may write), then asks the server
 * to verify and record it. Photos never pass through the app server, so the
 * only size limit is the 25 MB the dashboard allows.
 */
export function PhotoUploader({ folder, attach, multiple = true, label = 'Pilih foto', withAlt = true }: Props) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const altRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Array<{ ok: boolean; text: string }>>([])
  const [progress, setProgress] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function upload() {
    const files = Array.from(inputRef.current?.files ?? [])
    if (!files.length) {
      setMessages([{ ok: false, text: 'Pilih minimal satu foto.' }])
      return
    }
    const client = browserClient()
    if (!client) {
      setMessages([{ ok: false, text: 'Supabase belum dikonfigurasi.' }])
      return
    }
    const alt = altRef.current?.value ?? ''
    startTransition(async () => {
      const results: Array<{ ok: boolean; text: string }> = []
      let saved = 0
      for (const [i, file] of files.entries()) {
        setProgress(`Mengunggah ${i + 1} dari ${files.length}: ${file.name}…`)
        const checked = await checkImageFile(file)
        if (typeof checked === 'string') {
          results.push({ ok: false, text: checked })
          continue
        }
        const path = `${folder}/${crypto.randomUUID()}.${checked.ext}`
        const { error } = await client.storage.from('media').upload(path, file, {
          contentType: checked.contentType,
          cacheControl: '31536000',
          upsert: false,
        })
        if (error) {
          console.error('[geckodan] upload', error.message)
          results.push({ ok: false, text: `${file.name}: upload gagal. Masuk ulang lalu coba lagi.` })
          continue
        }
        try {
          const result = await attach(path, alt)
          if (result && !result.ok) results.push({ ok: false, text: `${file.name}: ${result.message}` })
          else saved++
        } catch {
          results.push({ ok: false, text: `${file.name}: gagal disimpan. Coba lagi.` })
        }
      }
      if (saved) results.unshift({ ok: true, text: `${saved} file tersimpan.` })
      setMessages(results)
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
      router.refresh()
    })
  }

  const id = `upload-${folder.replace(/[^a-z0-9]+/gi, '-')}`
  return (
    <div className="uploader">
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={multiple}
          disabled={pending}
        />
        <p className="hint">JPG, PNG, WebP, atau AVIF. Maksimal {MAX_IMAGE_MB} MB per file. Gunakan foto asli saja.</p>
      </div>
      {withAlt ? (
        <div className="field">
          <label htmlFor={`${id}-alt`}>Deskripsi foto (untuk pembaca layar)</label>
          <input ref={altRef} id={`${id}-alt`} type="text" maxLength={300} placeholder="Contoh: GD-0007 tampak samping" />
        </div>
      ) : null}
      <div>
        <button type="button" className="btn btn-dark" onClick={upload} disabled={pending} aria-busy={pending}>
          {pending ? 'Mengunggah…' : 'Upload'}
        </button>
      </div>
      <div aria-live="polite">
        {progress ? <p className="small">{progress}</p> : null}
        {messages.map((m, i) => (
          <p key={i} className={`flash ${m.ok ? 'flash--ok' : 'flash--error'}`}>
            {m.text}
          </p>
        ))}
      </div>
    </div>
  )
}
