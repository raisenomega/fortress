import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Marca (o desmarca) un proyecto como de confianza. Es lo unico que decide si
 * el agente puede autoverificarse: en un repo de confianza `npm run test:unit`
 * corre solo; en uno no confiable seria ejecutar codigo ajeno sin permiso.
 */
export function setProjectTrusted(context: AppContext, id: string, trusted: boolean): Result<null> {
  if (!context.projects.findById(id)) {
    return err('Ese proyecto ya no existe')
  }

  context.projects.setTrusted(id, trusted)
  return ok(null)
}
