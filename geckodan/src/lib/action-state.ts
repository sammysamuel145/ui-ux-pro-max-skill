/** Result of an admin Server Action, shown as a flash message by ActionForm. */
export type ActionState = { ok: boolean; message: string } | null

export const okState = (message: string): ActionState => ({ ok: true, message })
export const errorState = (message: string): ActionState => ({ ok: false, message })
