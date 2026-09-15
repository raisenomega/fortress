import type { Finding } from '@domain/project/finding'
import { seResuelveEnTerminal } from '@domain/project/se-resuelve-en-terminal'
import { FindingActions } from './FindingActions'
import { FindingMitigarAction } from './FindingMitigarAction'
import { FindingRepairAction } from './FindingRepairAction'
import { FindingResolverAction } from './FindingResolverAction'

interface FindingRowActionsProps {
  readonly finding: Finding
  readonly dismissed: boolean
  readonly mitigado: boolean
  readonly onDismiss: (id: string) => void
  readonly onReopen: (id: string) => void
  readonly onMitigate: (id: string, nota: string) => void
  readonly onUnmitigate: (id: string) => void
  readonly onRepair: (id: string) => void
  /** Abre el Terminal con este hallazgo fijado (ADR-088, pieza 2). */
  readonly onResolver: (id: string) => void
  readonly onVerificar: (id: string) => void
  readonly ocupado: boolean
}

/**
 * La celda de acciones de una fila. Sale de `FindingRow` para hacerle sitio a la
 * columna de seleccion: aquella estaba en 74 de 75 lineas y no cabia una `<td>`
 * mas. No cambia nada de lo que hace — es la misma celda, mudada.
 */
export function FindingRowActions(props: FindingRowActionsProps): React.JSX.Element {
  const { finding, dismissed, mitigado, ocupado } = props

  return (
    <>
      {!dismissed && !mitigado ? (
        <FindingRepairAction onRepair={() => props.onRepair(finding.id)} />
      ) : null}
      {seResuelveEnTerminal({ dismissed, mitigado }) ? (
        <FindingResolverAction onResolver={() => props.onResolver(finding.id)} />
      ) : null}
      <FindingMitigarAction
        finding={finding}
        dismissed={dismissed}
        mitigado={mitigado}
        onMitigate={props.onMitigate}
        onUnmitigate={() => props.onUnmitigate(finding.id)}
        onVerificar={() => props.onVerificar(finding.id)}
        ocupado={ocupado}
      />
      <FindingActions
        dismissed={dismissed}
        onDismiss={() => props.onDismiss(finding.id)}
        onReopen={() => props.onReopen(finding.id)}
      />
    </>
  )
}
