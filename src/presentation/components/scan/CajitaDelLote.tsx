import type { Finding } from '@domain/project/finding'
import { seResuelveEnTerminal, type EstadoDeLaFila } from '@domain/project/se-resuelve-en-terminal'
import type { LoteEnLaTabla } from '../../hooks/useLoteDelTablero'
import { CajitaDeSeleccion } from './CajitaDeSeleccion'

interface CajitaDelLoteProps {
  readonly lote: LoteEnLaTabla | null
  readonly finding: Finding
  /** Los dos hechos que la fila ya calculo: no se vuelven a contar aqui. */
  readonly fila: EstadoDeLaFila
}

/**
 * La cajita del LOTE al Terminal (ADR-088). Sale solo donde el lote se ofrece
 * —si no, `lote` llega null— y solo en las filas que piden trabajo, con el MISMO
 * criterio que «Resolver en Terminal». Nunca coincide con la de «Verificar
 * mitigados»: aquella exige mitigado y esta lo excluye, asi que comparten
 * columna sin pisarse.
 */
export function CajitaDelLote({
  lote,
  finding,
  fila
}: CajitaDelLoteProps): React.JSX.Element | null {
  if (lote === null || !seResuelveEnTerminal(fila)) return null
  return (
    <CajitaDeSeleccion
      marcada={lote.seleccion.has(finding.id)}
      titulo={`Lote del Terminal: ${finding.title}`}
      onToggle={() => lote.alternar(finding.id)}
    />
  )
}
