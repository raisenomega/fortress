import type { OperationMode } from '../settings/operation-mode'

/** Cuantos hallazgos lleva un lote como mucho. Es para probar el Terminal con
 *  calma, no para vaciar el Escaneo: diez turnos seguidos ya son una tarde. */
export const TOPE_DEL_LOTE = 10

/** Lo que se sugiere, sin forzarlo: cinco se revisan uno a uno sin perder el hilo. */
export const SUGERIDO_DEL_LOTE = 5

/**
 * Si el lote al Terminal se ofrece en este proyecto (ADR-088): donde el Terminal
 * PODRIA resolver —`resoluble`, calculado en el proceso principal— y el operador
 * trabaja en autonomo. En supervisado cada turno esperaria su Aprobar y el
 * productor no editaria: el lote no cerraria nada. En el repo propio de FORTRESS
 * `resoluble` es false y el lote no sale: alli se trabaja con el Motor.
 */
export function loteDisponible(resoluble: boolean, mode: OperationMode): boolean {
  return resoluble && mode === 'autonomo'
}

export interface AlternarEnLote {
  readonly seleccion: ReadonlySet<string>
  /** El que se queria anadir pasaba del tope: la seleccion vuelve igual. */
  readonly lleno: boolean
}

/** Alternar un hallazgo en el lote. Quitar siempre se puede; anadir el que
 *  pasaria del tope, no — y `lleno` lo dice para que la vista avise. */
export function alternarEnLote(previo: ReadonlySet<string>, id: string): AlternarEnLote {
  if (previo.has(id)) {
    const siguiente = new Set(previo)
    siguiente.delete(id)
    return { seleccion: siguiente, lleno: false }
  }
  if (previo.size >= TOPE_DEL_LOTE) return { seleccion: previo, lleno: true }
  return { seleccion: new Set([...previo, id]), lleno: false }
}
