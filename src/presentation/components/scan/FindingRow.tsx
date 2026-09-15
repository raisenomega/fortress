import type { Finding } from '@domain/project/finding'
import { verificable } from '@domain/project/verificable'
import { CajitaDeSeleccion } from './CajitaDeSeleccion'
import { FindingMarks } from './FindingMarks'
import { FindingRowActions } from './FindingRowActions'
import { SeverityBadge } from './SeverityBadge'

interface FindingRowProps {
  readonly finding: Finding
  readonly onDismiss: (id: string) => void
  readonly onReopen: (id: string) => void
  readonly onMitigate: (id: string, nota: string) => void
  readonly onUnmitigate: (id: string) => void
  readonly onRepair: (id: string) => void
  readonly onResolver: (id: string) => void
  readonly onVerificar: (id: string) => void
  readonly ocupado: boolean
  readonly seleccionada: boolean
  readonly onSeleccionar: (id: string) => void
}

/** Sin archivo ni linea un hallazgo no es accionable, pero se muestra igual. */
function location(finding: Finding): string {
  if (!finding.file) return 'sin ubicacion'
  return finding.line === null ? finding.file : `${finding.file}:${finding.line}`
}

export function FindingRow(props: FindingRowProps): React.JSX.Element {
  const { finding, seleccionada, onSeleccionar } = props
  // Descartado se atenua pero NO se esconde: sigue estando ahi, y el operador
  // tiene que poder ver que decidio ignorarlo y por que ya no bloquea.
  const dismissed = finding.status === 'false_positive'
  // Mitigado NO se atenua: el problema puede seguir ahi y el escaneo aun no lo
  // ha confirmado. Lo que cambia es que deja de pedir trabajo al motor.
  const mitigado = finding.lifecycle === 'MITIGATED'
  // La cajita mira los DOS ejes, como el bucle y el contador: uno descartado ya
  // no pide comprobacion, y ofrecerla gastaria una corrida en lo que su dueño
  // dijo que no contaba.
  const sePuedeVerificar = verificable(finding)

  return (
    <tr className={`border-b border-border/60 last:border-0 ${dismissed ? 'opacity-45' : ''}`}>
      <td className="py-2 pr-2 align-top">
        {sePuedeVerificar ? (
          <CajitaDeSeleccion
            marcada={seleccionada}
            titulo={`Seleccionar: ${finding.title}`}
            onToggle={() => onSeleccionar(finding.id)}
          />
        ) : null}
      </td>
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
        <FindingRowActions {...props} dismissed={dismissed} mitigado={mitigado} />
      </td>
    </tr>
  )
}
