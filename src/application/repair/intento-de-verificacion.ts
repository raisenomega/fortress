import type { AppContext } from '../context'
import { verificarMitigado } from './verificar-mitigado'

/**
 * Una verificacion, con su fallo convertido en dato. `null` en `desenlace` es el
 * mitigado que ya no habia que verificar —una propuesta viva lo trabaja—, no un
 * error: `verificarMitigado` lo devuelve a proposito.
 */
export type IntentoDeVerificacion =
  | { readonly ok: true; readonly desenlace: string | null }
  | { readonly ok: false; readonly error: string }

const SIN_MOTIVO = 'Fallo al verificar el hallazgo'

/**
 * Envuelve `verificarMitigado` SIN tocarlo. El barrido necesita que un fallo sea
 * un valor —para poder mirar el boton de parar antes de llamarlo averia— y la
 * verificacion de una en una necesita que sea una excepcion, porque su handler
 * la traduce a un `Result`. La diferencia se resuelve aqui, en una capa de una
 * funcion, en vez de cambiarle la forma a la pieza que ya usan los dos caminos.
 */
export async function intentarVerificar(
  context: AppContext,
  projectId: string,
  findingId: string
): Promise<IntentoDeVerificacion> {
  try {
    const dictamen = await verificarMitigado(context, projectId, findingId)
    return { ok: true, desenlace: dictamen === null ? null : dictamen.desenlace }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : SIN_MOTIVO }
  }
}
