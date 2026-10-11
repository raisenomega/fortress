import { ejecutaConConfianza } from '../repair/confianza'
import { effectiveMode, type ModoPedido } from './modo-efectivo'
import type { OperationMode } from './operation-mode'

/**
 * El EFECTO del toggle app-wide sobre UN proyecto, para que la UI diga la verdad
 * (PASO 152). El modo efectivo lo decide `effectiveMode` (REUSO, no copia); la
 * causa es REPORTE —lee cual de los hechos que aquel ya peso es el que degrada,
 * con precedencia—, nunca una segunda evaluacion de la regla.
 */
export type CausaDegradacion = 'sinConfianza' | 'repoPropio' | 'gitNoListo'

export interface EfectoDelModo {
  readonly modoEfectivo: OperationMode
  readonly causa: CausaDegradacion | null
}

export function efectoDelModo(pedido: ModoPedido): EfectoDelModo {
  const modoEfectivo = effectiveMode(pedido)
  if (modoEfectivo === pedido.mode) return { modoEfectivo, causa: null }
  if (!ejecutaConConfianza(pedido.project)) return { modoEfectivo, causa: 'sinConfianza' }
  if (pedido.selfRepo) return { modoEfectivo, causa: 'repoPropio' }
  return { modoEfectivo, causa: 'gitNoListo' }
}

const ETIQUETA: Record<CausaDegradacion, string> = {
  sinConfianza: 'sin confianza',
  repoPropio: 'repo propio',
  gitNoListo: 'git no listo'
}

/** El string del encabezado izquierdo: el efecto app-wide, nunca un modo propio. */
export function etiquetaDelEfecto({ modoEfectivo, causa }: EfectoDelModo): string {
  if (causa !== null) return `autónomo → solo-lectura · ${ETIQUETA[causa]}`
  return modoEfectivo === 'autonomo' ? 'autónomo' : 'supervisado'
}

/**
 * El COLOR de la etiqueta, hermano de `etiquetaDelEfecto`: del MISMO dato, sin
 * fuente nueva. Reusa los tokens semanticos del app (como `observation-tones`):
 * verde cuando la intencion se cumple, ambar cuando el autonomo degrada a
 * solo-lectura. El rojo `text-critical` queda de RESERVA para un futuro estado
 * inoperable (sin proyecto), que hoy no se pinta: la etiqueta solo se monta con
 * proyecto y el efecto siempre es valido — no se cablea rama muerta.
 */
export function colorDelEfecto({ causa }: EfectoDelModo): string {
  return causa === null ? 'text-success' : 'text-medium'
}
