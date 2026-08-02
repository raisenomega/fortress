import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Quita un proyecto de FORTRESS. El historial de chat cae con el por el
 * ON DELETE CASCADE del esquema; los archivos en disco no se tocan.
 */
export function removeProject(context: AppContext, id: string): Result<null> {
  if (!context.projects.findById(id)) {
    return err('Ese proyecto ya no existe')
  }

  context.projects.remove(id)
  return ok(null)
}
