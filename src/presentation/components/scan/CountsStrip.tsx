import {
  presentSeverities,
  totalFindings,
  type SeverityCounts
} from '@domain/project/severity-counts'
import { SeverityBadge } from './SeverityBadge'

interface CountsStripProps {
  readonly counts: SeverityCounts
  readonly scanned: boolean
}

export function CountsStrip({ counts, scanned }: CountsStripProps): React.JSX.Element | null {
  if (!scanned || totalFindings(counts) === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      {presentSeverities(counts).map((severity) => (
        <span key={severity} className="flex items-center gap-1.5">
          <SeverityBadge severity={severity} />
          <span className="font-mono text-sm text-foreground">{counts[severity]}</span>
        </span>
      ))}
    </div>
  )
}
