import type { TokenUsage } from './token-usage'

/**
 * Lo que costo UNA parada del recorrido. Existe para poder contestar la
 * pregunta que el escaneo de 199 minutos dejo sin respuesta: «¿degrado el
 * agente de la parada 1 a la 12, exploto en turns o se desplomo?».
 *
 * Hasta ahora solo quedaba el AGREGADO —una fila con la suma de las doce— y una
 * media no distingue doce paradas parejas de seis cortas y seis desbocadas. La
 * serie si.
 */
export interface NewParadaRun {
  readonly scanId: string
  readonly projectId: string
  /** 1..N, el orden en que se recorrio. Es lo que hace SERIE a la lista. */
  readonly paradaIndice: number
  /** Como se llamo: «apps/api», o «M2 DR/BCP — todo el proyecto». */
  readonly paradaRotulo: string
  readonly durationMs: number
  readonly usage: TokenUsage
  readonly at: string
}

export interface ParadaRun extends NewParadaRun {
  readonly id: string
}
