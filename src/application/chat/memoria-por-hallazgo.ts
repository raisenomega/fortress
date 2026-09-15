import type { AppContext } from '../context'
import type { TurnoProtegido } from './con-red-de-reversion'

/**
 * Tras un turno con foco, decide que recuerda el productor de ese hallazgo
 * (ADR-088, Enmienda 2).
 *
 * GARANTIA 1: la sesion NO avanza SOLO cuando la red REVIRTIO de verdad. Si
 * ADR-079 deshizo las ediciones, el productor no puede recordarlas como hechas:
 * la memoria se queda en el ultimo turno que si se conservo. Los otros dos casos
 * SI avanzan, y por eso no vale mirar `conservado` a secas:
 *
 *   red revirtio         -> no avanza (el arbol ya no tiene lo que recordaria)
 *   red conservo         -> avanza
 *   sin red (un «propon» en supervisado, sin checkpoint) -> avanza, para que
 *                           «aplicalo» recuerde lo que se propuso
 *
 * GARANTIA 2: la sesion rota se olvida siempre, revirtiera o no el turno.
 * Nada inventado: sin sesion en la respuesta no se escribe nada.
 */
export function recordarSesion(
  context: AppContext,
  findingId: string | null,
  turno: TurnoProtegido
): void {
  if (findingId === null) return
  const { sesion, sesionRota } = turno.outcome

  if (sesionRota === true) context.findings.olvidarSesionDelTerminal(findingId)
  if (turno.revertido || sesion === undefined) return
  context.findings.recordarSesionDelTerminal(findingId, sesion)
}
