import type { Finding } from './finding'

/**
 * El SEGUNDO eje del tablero. La severidad dice cuanto urge; esto dice en que
 * punto esta, y son ortogonales: hay CRITICAL por reparar y CRITICAL mitigados.
 *
 * No es `lifecycle` ni `status` sino la lectura del operador sobre AMBOS, que es
 * lo que el dominio ya dice de esos dos campos: «un hallazgo puede estar
 * descartado y ACTIVE, o abierto y EXTINCT» (finding-lifecycle). Las tres
 * casillas son las tres preguntas que se hace delante de la tabla:
 *
 *   por-reparar   pide trabajo: abierto y el problema sigue ahi
 *   mitigados     el limbo: el operador dijo que lo arreglo y nadie lo comprobo
 *   descartados   su decision de que no contaba
 *
 * Los EXTINCT no tienen casilla porque no llegan al tablero: su pantalla es la
 * historia (ADR-087), y el SQL los filtra antes de que nadie los pinte.
 */
export const ESTADOS_DEL_TABLERO = ['por-reparar', 'mitigados', 'descartados'] as const

export type EstadoDelTablero = (typeof ESTADOS_DEL_TABLERO)[number]

/**
 * A que casilla cae un hallazgo. Tabla exhaustiva y no una cadena de `if`: un
 * cuarto estado no compila hasta que alguien decida donde va.
 */
const CASILLA: Record<EstadoDelTablero, (f: Finding) => boolean> = {
  descartados: (f) => f.status === 'false_positive',
  mitigados: (f) => f.lifecycle === 'MITIGATED',
  'por-reparar': () => true
}

/**
 * El orden en que se PREGUNTA, que no es el orden en que se pintan los chips.
 * Va aparte a proposito: `por-reparar` contesta que si a todo —es el resto— y
 * con el primero en la lista se tragaria los otros dos.
 *
 * `descartados` manda sobre `mitigados` porque la decision del operador pesa mas
 * que el estado del problema: un mitigado que ademas se descarto ya no pide
 * nada, y ponerlo en el limbo lo ofreceria para verificar —gastando una corrida
 * de agente— cuando su dueño ya dijo que no contaba.
 */
const ORDEN_DE_DECISION: readonly EstadoDelTablero[] = ['descartados', 'mitigados', 'por-reparar']

export function estadoDelTablero(finding: Finding): EstadoDelTablero {
  return ORDEN_DE_DECISION.find((estado) => CASILLA[estado](finding)) ?? 'por-reparar'
}
