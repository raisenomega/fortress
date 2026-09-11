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
  /**
   * De los que aplican, los que NO tienen su plantilla sembrada. Se mide AQUI,
   * con el resto del reconocimiento, y no al componer el informe: el operador
   * puede sembrarla mañana, y entonces el informe de hoy diria que la tuvo.
   *
   * En la Fase 2 este dato se quedo fuera del manifiesto por ser un hecho de la
   * maquina del operador y no del proyecto auditado. Lo que cambia es para que
   * sirve: ya no describe el proyecto, describe con cuanta profundidad se le
   * audito — y eso es justo lo que el manifiesto promete y el cierre declara.
   */
  readonly plantillasAusentes: readonly ModuloAuditoria[]
}

export const REPARTO_VACIO: Reparto = { paradas: [], ficherosTotal: 0 }

export const MANIFIESTO_VACIO: Manifiesto = {
  ...REPARTO_VACIO,
  modulosAplicables: [],
  modulosDescartados: [],
  modulosSinConstancia: [],
  plantillasAusentes: []
}
