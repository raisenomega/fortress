import type { Finding } from '@domain/project/project'
import { SeverityBadge } from './SeverityBadge'

interface FindingRowProps {
  readonly finding: Finding
}

/** Sin archivo ni linea un hallazgo no es accionable, pero se muestra igual. */
function location(finding: Finding): string {
  if (!finding.file) return 'sin ubicacion'
  return finding.line === null ? finding.file : `${finding.file}:${finding.line}`
}

export function FindingRow({ finding }: FindingRowProps): React.JSX.Element {
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="py-2 pr-3 align-top">
        <SeverityBadge severity={finding.severity} />
      </td>
      <td className="py-2 pr-3 align-top text-sm text-foreground">{finding.title}</td>
      <td className="py-2 align-top font-mono text-[11px] whitespace-nowrap text-muted-foreground">
        {location(finding)}
      </td>
    </tr>
  )
}
