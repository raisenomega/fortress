import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Enciende o apaga el loop autonomo de un proyecto. El gate (topes guardados +
 * confianza) lo aplica la UI antes de llegar aqui; esto solo persiste el flag.
 */
export function setProjectLoopEnabled(
  context: AppContext,
  id: string,
  enabled: boolean
): Result<null> {
  if (!context.projects.findById(id)) {
    return err('Ese proyecto ya no existe')
  }

  context.projects.setLoopEnabled(id, enabled)
  return ok(null)
}
