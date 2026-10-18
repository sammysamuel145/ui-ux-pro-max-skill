'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'
import type { ActionState } from '@/lib/action-state'

type Props = {
  action: (formData: FormData) => Promise<ActionState>
  /** Field name the action reads the file from. */
  field?: string
  multiple?: boolean
  label?: string
  withAlt?: boolean
}

/**
 * Sends one file per request, so each upload stays under the Server Action
 * body limit no matter how many photos are selected.
 */
export function PhotoUploader({ action, field = 'photos', multiple = true, label = 'Pilih foto', withAlt = true }: Props) {
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
    const alt = altRef.current?.value ?? ''
    startTransition(async () => {
      const results: Array<{ ok: boolean; text: string }> = []
      for (const [i, file] of files.entries()) {
        setProgress(`Mengunggah ${i + 1} dari ${files.length}…`)
        const data = new FormData()
        data.append(field, file)
        data.append('alt', alt)
        try {
          const result = await action(data)
          if (result && !result.ok) results.push({ ok: false, text: `${file.name}: ${result.message}` })
        } catch {
          results.push({ ok: false, text: `${file.name}: upload gagal (file mungkin terlalu besar).` })
        }
      }
      const failed = results.length
      if (failed < files.length) results.unshift({ ok: true, text: `${files.length - failed} file tersimpan.` })
      setMessages(results)
      setProgress(null)
      if (inputRef.current) inputRef.current.value = ''
      router.refresh()
    })
  }

  const id = `upload-${field}`
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
        <p className="hint">JPG, PNG, WebP, atau AVIF. Maksimal 8 MB per file. Gunakan foto asli saja.</p>
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
