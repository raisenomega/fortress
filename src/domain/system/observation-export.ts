import { ordenarObservaciones, type ObservationConFrecuencia } from './observation-order'
import type { SelfObservation } from './self-observation'

/**
 * Lo que el fichero declara de si mismo. No es adorno: quien lo lee —Claude Code
 * en la terminal, o el operador dentro de seis meses— tiene que saber por que
 * esta en ese orden.
 *
 * Hasta ADR-085 Fase 4 esto era una ADVERTENCIA: el orden salia de contar el
 * `area` literal, el campo era texto libre y el fichero tenia que confesar que
 * infravaloraba los temas. Con el vocabulario cerrado y `vistaEn` esa
 * advertencia dejo de ser verdad, asi que se retira en vez de arrastrarse: un
 * aviso que ya no aplica ensena a no leer los avisos.
 */
const COMO_ORDENA = [
  'Ordenado por `vistaEn`: en cuantos PROYECTOS distintos se topo el mismo hueco.',
  'Eso es la senal —lo que le falta a FORTRESS en todos los stacks— y no la',
  'repeticion: una queja treinta veces en un proyecto sigue siendo una.'
].join(' ')

const COMO_USARLO = [
  'Las observaciones van en crudo y sin agrupar a proposito: agrupar por parecido',
  'es lo que sabe hacer quien lee. Este fichero solo entrega lo que faltaba.'
].join(' ')

export interface ObservationExport {
  readonly generadoEl: string
  readonly total: number
  /** Cuantos valores distintos tiene `area`. Con el vocabulario cerrado deberia
   *  tender a doce; lo que pase de ahi son filas anteriores a ADR-085 Fase 4. */
  readonly areasDistintas: number
  readonly comoOrdena: string
  readonly comoUsarlo: string
  readonly observaciones: readonly ObservationConFrecuencia[]
}

/** El backlog entero, ordenado, con su propia advertencia dentro. */
export function buildObservationExport(
  observations: readonly SelfObservation[],
  at: string,
  vistaEn: (id: string) => number = () => 0
): ObservationExport {
  const ordenadas = ordenarObservaciones(observations, vistaEn)
  return {
    generadoEl: at,
    total: ordenadas.length,
    areasDistintas: new Set(observations.map((o) => o.area)).size,
    comoOrdena: COMO_ORDENA,
    comoUsarlo: COMO_USARLO,
    observaciones: ordenadas
  }
}
