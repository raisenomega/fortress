import { EyeOff, RotateCcw } from 'lucide-react'
import type { Finding } from '@domain/project/project'
import { SeverityBadge } from './SeverityBadge'

interface FindingRowProps {
  readonly finding: Finding
  readonly onDismiss: (id: string) => void
  readonly onReopen: (id: string) => void
}

/** Sin archivo ni linea un hallazgo no es accionable, pero se muestra igual. */
function location(finding: Finding): string {
  if (!finding.file) return 'sin ubicacion'
  return finding.line === null ? finding.file : `${finding.file}:${finding.line}`
}

export function FindingRow({ finding, onDismiss, onReopen }: FindingRowProps): React.JSX.Element {
  // Descartado se atenua pero NO se esconde: sigue estando ahi, y el operador
  // tiene que poder ver que decidio ignorarlo y por que ya no bloquea.
  const dismissed = finding.status === 'false_positive'

  return (
    <tr className={`border-b border-border/60 last:border-0 ${dismissed ? 'opacity-45' : ''}`}>
      <td className="py-2 pr-3 align-top">
        <SeverityBadge severity={finding.severity} />
      </td>
      <td className="py-2 pr-3 align-top text-sm text-foreground">
        <span className={dismissed ? 'line-through' : ''}>{finding.title}</span>
        {dismissed ? (
          <span className="ml-2 text-[10px] tracking-wide text-muted-foreground uppercase">
            falso positivo
          </span>
        ) : null}
      </td>
      <td className="py-2 pr-3 align-top font-mono text-[11px] whitespace-nowrap text-muted-foreground">
        {location(finding)}
      </td>
      <td className="py-2 align-top text-right">
        <button
          type="button"
          onClick={() => (dismissed ? onReopen(finding.id) : onDismiss(finding.id))}
          title={
            dismissed
              ? 'Volver a contarlo'
              : 'Descartar como falso positivo: dejara de contar y de bloquear el push'
          }
          className="tap text-muted-foreground hover:text-foreground"
        >
          {dismissed ? <RotateCcw size={13} aria-hidden /> : <EyeOff size={13} aria-hidden />}
        </button>
      </td>
    </tr>
  )
}
