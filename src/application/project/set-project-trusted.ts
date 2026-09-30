import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Marca (o desmarca) un proyecto como de confianza. Es lo unico que decide si
 * el agente puede autoverificarse: en un repo de confianza `npm run test:unit`
 * corre solo; en uno no confiable seria ejecutar codigo ajeno sin permiso.
 *
 * Revocar la confianza APAGA el flag del loop. ADR-107 retiro el loop, pero la
 * columna vive con su historia, y un `loop_enabled` encendido en un proyecto en
 * el que ya no se confia seria un estado que miente. Ya no hay proceso que
 * detener: `stopLoop` se fue con el loop.
 */
export function setProjectTrusted(
  context: AppContext,
  id: string,
  trusted: boolean
): Result<null> {
  if (!context.projects.findById(id)) {
    return err('Ese proyecto ya no existe')
  }

  context.projects.setTrusted(id, trusted)
  if (!trusted) {
    context.projects.setLoopEnabled(id, false)
  }
  return ok(null)
}
