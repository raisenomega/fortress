import type { Severity } from '@domain/shared/severity'

const TONE: Record<Severity, string> = {
  CRITICAL: 'border-critical/40 bg-critical/15 text-critical',
  HIGH: 'border-high/40 bg-high/15 text-high',
  MEDIUM: 'border-medium/40 bg-medium/15 text-medium',
  LOW: 'border-low/40 bg-low/15 text-low'
}

interface SeverityBadgeProps {
  readonly severity: Severity
}

export function SeverityBadge({ severity }: SeverityBadgeProps): React.JSX.Element {
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${TONE[severity]}`}
    >
      {severity}
    </span>
  )
}
