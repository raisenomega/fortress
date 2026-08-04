import { presentSeverities, totalFindings, type SeverityCounts } from '../project/severity-counts'
import type { OmegaVerdict } from './omega-entry'

/**
 * Resumen forense del estado actual de un proyecto para el Libro de la Vida.
 * Fase 2: registra lo que HAY (hallazgos abiertos). La verificacion contra el
 * filesystem —discrepancias entre lo reportado y el disco— llega en la Fase 3.
 */
export function auditSummary(counts: SeverityCounts): {
  readonly summary: string
  readonly verdict: OmegaVerdict
} {
  if (totalFindings(counts) === 0) {
    return { summary: 'Auditoria: sin hallazgos abiertos registrados.', verdict: 'ok' }
  }

  const detalle = presentSeverities(counts)
    .map((severity) => `${counts[severity]} ${severity}`)
    .join(', ')

  return { summary: `Auditoria: ${totalFindings(counts)} hallazgos abiertos (${detalle}).`, verdict: 'info' }
}
