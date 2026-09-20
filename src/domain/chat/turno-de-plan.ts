/** Las dos señas por las que se reconoce un turno del lote. */
export interface SenasDelTurno {
  /** `known` son los hallazgos del LOTE, no el historial del escaneo. */
  readonly deLote?: boolean
  /** El bloque del hallazgo que este turno resuelve, si resuelve uno. */
  readonly enFoco?: string
}

/**
 * El turno de PLAN del lote: lleva la LISTA y NO lleva foco (ADR-088, arco 1).
 * Con foco es un turno de RESOLUCION — edita, y se juzga con el diff delante.
 *
 * Vive en el dominio porque lo preguntan DOS capas que no se ven entre si: el
 * prompt (que instruccion recibe el agente) y el adaptador del CLI (con que
 * permisos corre). Escrito dos veces se desfasa en uno, y entonces el agente
 * leeria «planea» mientras corre con permiso de editar, o al reves.
 */
export const esTurnoDePlanDelLote = (t: SenasDelTurno): boolean =>
  t.deLote === true && t.enFoco === undefined
