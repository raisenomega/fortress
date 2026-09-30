import type { AppContext } from '../context'
import type { Analysis } from '@domain/repair/analysis'

/**
 * Lo que el analista noto de FORTRESS se guarda PASE LO QUE PASE con el
 * hallazgo: un limite con el que se topo vale igual si el hallazgo era un
 * fantasma.
 *
 * Sale de `planRepair` porque aquel fichero llego a su techo de lineas, y el
 * corte se hace por responsabilidad: esto es asentar, no planificar. Desde
 * ADR-107 el proyecto es SIEMPRE el repo propio —el Motor no trabaja otro—, asi
 * que `sourceProject` y `projectPath` no pueden llevar datos de un cliente.
 */
export function asentarNotasDelAnalista(
  context: AppContext,
  project: { readonly name: string; readonly path: string },
  analysis: Analysis
): void {
  for (const nota of analysis.notes ?? []) {
    context.selfObservations.add({
      ...nota,
      sourceProject: project.name,
      projectPath: project.path
    })
  }
}
