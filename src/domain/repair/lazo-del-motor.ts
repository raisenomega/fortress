import type { OmegaAxis } from './omega-verdict'
import { MARGEN_DE_VUELTA_USD, TOPE_DE_VUELTAS, TOPE_POR_PROPUESTA_USD } from './topes-del-lazo'

export interface EstadoDelLazo {
  /** Vueltas del generador YA dadas, incluida la primera. */
  readonly vueltasDadas: number
  /** Huellas del diff de las vueltas anteriores. */
  readonly huellasVistas: readonly string[]
  /** Dolares que la propuesta lleva gastados, sumando TODAS sus corridas. */
  readonly gastadoUsd: number
}

export interface LoQueDejoLaVuelta {
  readonly resuelve: OmegaAxis
  /** sha1 del trabajo, o null si git no se dejo leer. */
  readonly huella: string | null
  /** La sesion del generador, o null si no hay nada que reanudar. */
  readonly sesion: string | null
}

export type ParadaDelLazo =
  | 'completo'
  | 'convergio'
  | 'tope-de-vueltas'
  | 'tope-de-dolares'
  | 'sin-sesion'
  | 'sin-huella'

export type DecisionDelLazo =
  /** `sesion` viaja con el SI: la decision ya comprobo que existe, y devolverla
   *  evita que quien sigue tenga que afirmarlo otra vez con un cast. */
  | { readonly seguir: true; readonly sesion: string }
  | { readonly seguir: false; readonly parada: ParadaDelLazo }

const parar = (parada: ParadaDelLazo): DecisionDelLazo => ({ seguir: false, parada })

/**
 * Si el Motor da otra vuelta, y si no, POR QUE no (ADR-110 §4).
 *
 * El disparo es un EJE dentro de un veredicto aprobado: por D19 un `PARCIAL` no
 * veta, asi que hoy sale a la firma como esta —y firmarlo mitiga el hallazgo
 * ENTERO, con su mitad abierta dentro—. Ninguna parada es un fallo: un `PARCIAL`
 * que converge es un desenlace, y se cuenta como tal.
 *
 * CONVERGER NO ES UN CONTADOR, y el orden lo dice: primero se mira si el trabajo
 * AVANZA (la huella), y solo despues la prudencia (el tope y el dinero).
 */
export function decidirOtraVuelta(
  vuelta: LoQueDejoLaVuelta,
  estado: EstadoDelLazo
): DecisionDelLazo {
  if (vuelta.resuelve !== 'PARCIAL') return parar('completo')
  if (vuelta.sesion === null) return parar('sin-sesion')
  if (vuelta.huella === null) return parar('sin-huella')
  if (estado.huellasVistas.includes(vuelta.huella)) return parar('convergio')
  if (estado.vueltasDadas >= TOPE_DE_VUELTAS) return parar('tope-de-vueltas')
  if (estado.gastadoUsd + MARGEN_DE_VUELTA_USD > TOPE_POR_PROPUESTA_USD) return parar('tope-de-dolares') // prettier-ignore
  return { seguir: true, sesion: vuelta.sesion }
}
