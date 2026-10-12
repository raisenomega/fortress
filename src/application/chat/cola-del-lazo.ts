import { ordenarCola } from '@domain/repair/orden-de-la-cola'
import { candidates } from '../repair/elegir-objetivo'
import type { AppContext } from '../context'

/**
 * La cola determinista del lazo CTO<->Terminal (ATERRIZAJE-1): los hallazgos
 * ELEGIBLES del proyecto en el MISMO orden del Motor (severidad primero),
 * reusando `candidates` (su cola) + `ordenarCola` (la seleccion firmada). Sin
 * HEAD no hay descuentos anclados y la cola sale vacia, como en el cerco.
 *
 * Se CONGELA al arrancar el lazo: quien la llama guarda ESTE resultado y no lo
 * recomputa —el candado estable—; re-auditar a mitad no la cambia.
 */
export function colaDelLazo(context: AppContext, projectId: string): readonly string[] {
  const project = context.projects.findById(projectId)
  if (project === null) return []
  const headSha = context.headSha(project.path)
  if (headSha === null) return []
  return ordenarCola(candidates(context, projectId, headSha, project.path, 'hasta-omega'))
}
