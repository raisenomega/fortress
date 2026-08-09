import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/**
 * Marca (o desmarca) un proyecto como de confianza. Es lo unico que decide si
 * el agente puede autoverificarse: en un repo de confianza `npm run test:unit`
 * corre solo; en uno no confiable seria ejecutar codigo ajeno sin permiso.
 *
 * Revocar la confianza APAGA y DETIENE el loop autonomo: un proyecto en el que
 * ya no se confia no puede seguir editandose solo. `stopLoop` lo inyecta la
 * infra (matar el proceso en curso es su terreno); se llama tambien con el
 * loop ya apagado, porque parar de mas es gratis y parar de menos era el bug.
 */
export function setProjectTrusted(
  context: AppContext,
  id: string,
  trusted: boolean,
  stopLoop: (id: string) => void
): Result<null> {
  if (!context.projects.findById(id)) {
    return err('Ese proyecto ya no existe')
  }

  context.projects.setTrusted(id, trusted)
  if (!trusted) {
    context.projects.setLoopEnabled(id, false)
    stopLoop(id)
  }
  return ok(null)
}
