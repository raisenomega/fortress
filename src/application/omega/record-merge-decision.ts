import { mergeDecisionEntry, type MergeDecision } from '@domain/omega/merge-decision'
import type { AppContext } from '../context'

/**
 * OMEGA deja constancia de cada decision de integracion automatica en el Libro
 * de la Vida, se haya aplicado o no. Mismo criterio que con la publicacion: el
 * registro no cambia la regla, la documenta con evidencia — que politica se
 * cumplio, que archivos se tocaron, cuantas lineas, y el commit si llego a
 * haberlo.
 *
 * Se asienta SIEMPRE, tambien cuando se deniega. Un motor que solo registra
 * sus aciertos deja al operador sin la mitad de la historia, y es justo la
 * mitad que hace falta para decidir si la politica esta bien calibrada.
 */
export function recordMergeDecision(context: AppContext, decision: MergeDecision): void {
  context.omegaLog.append(mergeDecisionEntry(decision))
}
