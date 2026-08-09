import { loopBlocked } from '@domain/loop/loop-gate'
import { loopConfigured } from '@domain/settings/loop-budget'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { readLoopBudget } from '../settings/read-loop-budget'

/**
 * Enciende o apaga el loop autonomo de un proyecto. El gate vive AQUI, en el
 * main: la UI muestra los mismos requisitos, pero quien llame al canal IPC
 * directo se topa con la misma pared. `isSelfRepo` lo inyecta la infra (leer
 * package.json del disco es su terreno). Apagar no exige gate: apagar siempre
 * se puede.
 */
export function setProjectLoopEnabled(
  context: AppContext,
  id: string,
  enabled: boolean,
  isSelfRepo: (path: string) => boolean
): Result<null> {
  const project = context.projects.findById(id)
  if (!project) return err('Ese proyecto ya no existe')

  if (enabled) {
    const blocked = loopBlocked({
      trusted: project.trusted,
      selfRepo: isSelfRepo(project.path),
      configured: loopConfigured(readLoopBudget(context))
    })
    if (blocked !== null) return err(blocked)
  }

  context.projects.setLoopEnabled(id, enabled)
  return ok(null)
}
