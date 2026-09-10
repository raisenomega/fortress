import type { ModuloAuditoria } from './modulo-auditoria'
import type { ModuloConRazon } from './modulos-aplicables'

/**
 * Un pedazo de codigo con sentido arquitectonico, que el escaneo audita ENTERO
 * y de una vez (ADR-082). La unidad del recorrido: se termina o no se empieza,
 * nunca se queda a mitad.
 */
export interface Parada {
  /** Ruta relativa de la carpeta que agrupa, o `.` para la raiz del proyecto. */
  readonly carpeta: string
  /** Los ficheros de fuente que le tocan, en rutas relativas a la raiz. */
  readonly ficheros: readonly string[]
}

/**
 * El reparto de la fuente en paradas, sin nada mas. Es lo que `dividirEnParadas`
 * sabe decir: cuenta ficheros y los agrupa, y no tiene por que saber que
 * plantillas de auditoria aplican —ni la evidencia para decidirlo, que no viaja
 * en las rutas de la fuente—.
 */
export interface Reparto {
  readonly paradas: readonly Parada[]
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
export interface Manifiesto extends Reparto {
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
