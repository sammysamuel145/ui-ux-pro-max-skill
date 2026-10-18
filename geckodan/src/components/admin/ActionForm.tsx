'use client'

import { createContext, useContext, useState, useTransition, type ReactNode } from 'react'
import type { ActionState } from '@/lib/action-state'

const PendingContext = createContext(false)

type Props = {
  action: (formData: FormData) => Promise<ActionState>
  children: ReactNode
  className?: string
  /** Clears the fields after a successful save, for "add new" forms. */
  resetOnSuccess?: boolean
  /** Asks before submitting, for destructive actions. */
  confirm?: string
  label?: string
}

/**
 * Submits to a Server Action without React's automatic form reset, so the
 * owner keeps what they typed when validation fails, and shows the result.
 */
export function ActionForm({ action, children, className, resetOnSuccess, confirm, label }: Props) {
  const [state, setState] = useState<ActionState>(null)
  const [pending, startTransition] = useTransition()

  return (
    <form
      className={className}
      aria-label={label}
      onSubmit={(event) => {
        event.preventDefault()
        if (confirm && !window.confirm(confirm)) return
        const form = event.currentTarget
        const data = new FormData(form)
        startTransition(async () => {
          const result = await action(data)
          setState(result)
          if (result?.ok && resetOnSuccess) form.reset()
        })
      }}
    >
      <PendingContext.Provider value={pending}>{children}</PendingContext.Provider>
      <div aria-live="polite">
        {state ? <p className={`flash ${state.ok ? 'flash--ok' : 'flash--error'}`}>{state.message}</p> : null}
      </div>
    </form>
  )
}

export function SubmitButton({ children, variant = 'btn-dark', small }: { children: ReactNode; variant?: string; small?: boolean }) {
  const pending = useContext(PendingContext)
  return (
    <button type="submit" className={`btn ${variant}${small ? ' btn-sm' : ''}`} disabled={pending} aria-busy={pending}>
      {pending ? 'Menyimpan…' : children}
    </button>
  )
}
