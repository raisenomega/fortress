import type { EvidenciaDeModulos } from './modulos-detectados'

/** Un proyecto SIN nada que delate ningun modulo. Punto de partida de todos. */
export const NADA: EvidenciaDeModulos = { ficheros: [], dependencias: [] }

/** La evidencia de un proyecto, escrita en una linea. */
export const con = (
  ficheros: readonly string[],
  dependencias: readonly string[] = []
): EvidenciaDeModulos => ({ ficheros, dependencias })
