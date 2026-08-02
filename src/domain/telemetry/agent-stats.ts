import { fingerprintOf } from '../project/finding-fingerprint'
import type { DetectedFinding } from '../scan/detected-finding'

export interface FindingOutcome {
  /** Hallazgos distintos que el agente ha reportado alguna vez. */
  readonly reported: number
  /** Ya no aparecen en el ultimo escaneo: se arreglaron. */
  readonly resolved: number
  /** El operador los marco como falsos positivos. */
  readonly dismissed: number
  /** Siguen abiertos ahora mismo. */
  readonly open: number
}

interface CurrentFinding extends DetectedFinding {
  readonly status: string
}

/**
 * Compara lo que el agente reporto historicamente con lo que sigue en pie.
 * Se trabaja con huellas y no con filas porque cada escaneo sustituye las
 * filas: sin la huella, un hallazgo arreglado y uno nuevo serian
 * indistinguibles.
 */
export function findingOutcome(
  reportedEver: readonly DetectedFinding[],
  current: readonly CurrentFinding[]
): FindingOutcome {
  const reported = new Set(reportedEver.map(fingerprintOf))

  const open = new Set(current.filter((finding) => finding.status === 'open').map(fingerprintOf))
  const dismissed = new Set(
    current.filter((finding) => finding.status !== 'open').map(fingerprintOf)
  )

  const vivos = [...reported].filter((print) => open.has(print) || dismissed.has(print))

  return {
    reported: reported.size,
    resolved: reported.size - vivos.length,
    dismissed: [...reported].filter((print) => dismissed.has(print)).length,
    open: [...reported].filter((print) => open.has(print)).length
  }
}

/**
 * Proporcion de hallazgos que dejaron de aparecer. Null si el agente no ha
 * reportado nada: sin denominador no hay porcentaje, y un 0% sugeriria que
 * trabajo mal en vez de que no ha trabajado.
 */
export function effectiveness(outcome: FindingOutcome): number | null {
  return outcome.reported === 0 ? null : outcome.resolved / outcome.reported
}
