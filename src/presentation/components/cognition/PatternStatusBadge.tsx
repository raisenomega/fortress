import type { PatternStatus } from '@domain/cognition/cognition-log'

/** Rojo vive, amarillo contenido, verde extinto. */
const TONE: Record<PatternStatus, string> = {
  ACTIVE: 'border-critical/40 bg-critical/15 text-critical',
  MITIGATED: 'border-medium/40 bg-medium/15 text-medium',
  EXTINTO: 'border-success/40 bg-success/15 text-success'
}

interface PatternStatusBadgeProps {
  readonly status: PatternStatus
}

export function PatternStatusBadge({ status }: PatternStatusBadgeProps): React.JSX.Element {
  return (
    <span
      className={`rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold ${TONE[status]}`}
    >
      {status}
    </span>
  )
}
