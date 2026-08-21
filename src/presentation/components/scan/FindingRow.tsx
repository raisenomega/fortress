import type { Finding } from '@domain/project/finding'
import { FindingActions } from './FindingActions'
import { FindingMarks } from './FindingMarks'
import { SeverityBadge } from './SeverityBadge'

interface FindingRowProps {
  readonly finding: Finding
  readonly onDismiss: (id: string) => void
  readonly onReopen: (id: string) => void
  readonly onMitigate: (id: string, nota: string) => void
}

/** Sin archivo ni linea un hallazgo no es accionable, pero se muestra igual. */
function location(finding: Finding): string {
  if (!finding.file) return 'sin ubicacion'
  return finding.line === null ? finding.file : `${finding.file}:${finding.line}`
}

export function FindingRow({
  finding,
  onDismiss,
  onReopen,
  onMitigate
}: FindingRowProps): React.JSX.Element {
  // Descartado se atenua pero NO se esconde: sigue estando ahi, y el operador
  // tiene que poder ver que decidio ignorarlo y por que ya no bloquea.
  const dismissed = finding.status === 'false_positive'
  // Mitigado NO se atenua: el problema puede seguir ahi y el escaneo aun no lo
  // ha confirmado. Lo que cambia es que deja de pedir trabajo al motor.
  const mitigado = finding.lifecycle === 'MITIGATED'

  const marcar = (): void => {
    const nota = window.prompt('Que lo arregla (por ejemplo el sha del commit):')
    if (nota !== null && nota.trim() !== '') onMitigate(finding.id, nota)
  }

  return (
    <tr className={`border-b border-border/60 last:border-0 ${dismissed ? 'opacity-45' : ''}`}>
      <td className="py-2 pr-3 align-top">
        <SeverityBadge severity={finding.severity} />
      </td>
      <td className="py-2 pr-3 align-top text-sm text-foreground">
        <FindingMarks finding={finding} dismissed={dismissed} mitigado={mitigado} />
      </td>
      <td className="py-2 pr-3 align-top font-mono text-[11px] whitespace-nowrap text-muted-foreground">
        {location(finding)}
      </td>
      <td className="py-2 align-top text-right whitespace-nowrap">
        <FindingActions
          dismissed={dismissed}
          mitigado={mitigado}
          onDismiss={() => onDismiss(finding.id)}
          onReopen={() => onReopen(finding.id)}
          onMitigate={marcar}
        />
      </td>
    </tr>
  )
}
