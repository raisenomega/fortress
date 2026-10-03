import { aislarCulpables } from '@domain/repair/aislar-culpables'
import type { MedidaDelArbol } from '@domain/repair/asiento-de-la-medida'
import { ordenDeFirma, type GuiaDeOrden } from '@domain/repair/orden-de-firma'
import type { PropuestaEnCola } from './tanda-de-firma'

export interface ResultadoDeTanda {
  readonly guia: GuiaDeOrden
  /** Lo que la sonda cubrio. Las de dependencias quedan FUERA a proposito: el
   *  `node_modules` del anfitrion no las representa (`tocaDependencias`), y
   *  tambien las que no tienen rama legible en el libro. */
  readonly sondadas: readonly string[]
  readonly veredicto: 'verde' | 'rojo' | 'sin-tanda'
  readonly culpables: readonly string[]
  readonly medidas: number
  readonly detalle: string
}

/**
 * Medir la tanda (deuda #2, pieza 2): UNA sonda del conjunto y, solo si sale
 * roja, la biseccion que nombra a los culpables. NADA caduca por este camino:
 * no hubo firma, solo medicion — el aviso llega ANTES de gastar la propuesta.
 * No toca las politicas firmadas: SIN_MEDIR y el caducar de la firma
 * individual siguen exactamente donde estaban.
 */
export async function medirLaTanda(
  cola: readonly PropuestaEnCola[],
  sonda: (ids: readonly string[]) => Promise<MedidaDelArbol>
): Promise<ResultadoDeTanda> {
  const guia = ordenDeFirma(cola)
  const fuera = new Set(guia.dependencias)
  const sondadas = cola.filter((p) => !fuera.has(p.id) && p.branch !== null).map((p) => p.id)

  if (sondadas.length < 2) {
    return { guia, sondadas, veredicto: 'sin-tanda', culpables: [], medidas: 0, detalle: 'con menos de dos medibles no hay tanda que sondar' } // prettier-ignore
  }
  const primera = await sonda(sondadas)
  if (primera.ok) {
    return { guia, sondadas, veredicto: 'verde', culpables: [], medidas: 1, detalle: `las ${sondadas.length} entran juntas; firma en el orden sugerido` } // prettier-ignore
  }
  const aislado = await aislarCulpables(sondadas, async (ids) => (await sonda(ids)).ok)
  return { guia, sondadas, veredicto: 'rojo', culpables: aislado.culpables, medidas: 1 + aislado.medidas, detalle: primera.detalle } // prettier-ignore
}
