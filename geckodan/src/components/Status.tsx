import { STATUS_LABEL } from '@/lib/labels'
import type { GeckoStatus } from '@/lib/types'

export function Status({ status }: { status: GeckoStatus }) {
  return (
    <span className="status" data-status={status}>
      {STATUS_LABEL[status]}
    </span>
  )
}
