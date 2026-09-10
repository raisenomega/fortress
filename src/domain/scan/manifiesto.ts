import type { ModuloAuditoria } from './modulo-auditoria'
import type { ModuloConRazon } from './modulos-aplicables'
import type { Parada, ParadaDeCarpeta } from './parada'

export type { Parada, ParadaDeCarpeta, ParadaDeTema } from './parada'

/**
 * El reparto de la fuente en paradas, sin nada mas. Es lo que `dividirEnParadas`
 * sabe decir: cuenta ficheros y los agrupa, y no tiene por que saber que
 * plantillas de auditoria aplican —ni la evidencia para decidirlo, que no viaja
 * en las rutas de la fuente—.
 */
export interface Reparto {
  /** Solo de CARPETA: el reparto sale de repartir ficheros, y un tema no tiene. */
  readonly paradas: readonly ParadaDeCarpeta[]
  /** La Y de «audite X de Y ficheros». Suma exacta de las paradas. */
  readonly ficherosTotal: number
}

/**
 * Lo que el reconocimiento midio ANTES de escanear nada: cuantas paradas hay,
 * cuantos ficheros suman y QUE MODULOS de la campana aplican (ADR-083). Es el
 * numero con el que el escaneo se compromete —las XX paradas se completan
 * todas— y contra el que se declara la cobertura al cerrar (Enmienda 2).
 *
 * Los descartados y los que no constan viajan con el manifiesto, no aparte: el
 * informe transcribe «M2 NO APLICA porque X», y un modulo que se cae por el
 * camino vuelve a ser el hueco que la decision 4 vino a cerrar.
 */
export interface Manifiesto {
  /**
   * Las DOS clases (ADR-083, Fase 3). No extiende `Reparto` porque aqui las
   * paradas son mas anchas que ahi: el reparto solo sabe hacer de carpeta, y el
   * manifiesto es quien junta esas con las de tema.
   */
  readonly paradas: readonly Parada[]
  readonly ficherosTotal: number
  readonly modulosAplicables: readonly ModuloAuditoria[]
  readonly modulosDescartados: readonly ModuloConRazon[]
  readonly modulosSinConstancia: readonly ModuloConRazon[]
}

export const REPARTO_VACIO: Reparto = { paradas: [], ficherosTotal: 0 }

export const MANIFIESTO_VACIO: Manifiesto = {
  ...REPARTO_VACIO,
  modulosAplicables: [],
  modulosDescartados: [],
  modulosSinConstancia: []
}
