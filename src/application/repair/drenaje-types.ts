import type { MotorChainDeps } from './run-motor-chain'

/** Por que termino el drenaje. `detenido` es una decision, no un fallo. */
export type FinDelDrenaje = 'sin-candidato' | 'tope-vueltas' | 'tope-gasto' | 'detenido' | 'averia'

/**
 * Lo que la corrida HIZO, no solo lo que dejo. Un parte que solo contaba las
 * que esperan firma leia una corrida de tres —dos aprobadas y una muerta por
 * presupuesto— como si hubiera trabajado dos, y el operador se pregunto por que
 * el drenaje "paro antes de tiempo" cuando habia agotado el pozo.
 */
export interface DrenajeResultado {
  readonly fin: FinDelDrenaje
  /** Vueltas que movieron el expediente de alguien. */
  readonly trabajadas: number
  /** Propuestas que quedaron juzgadas y esperando firma. */
  readonly acumuladas: number
  /** El revisor dijo que no. */
  readonly vetadas: number
  /** Murieron al pasarse del tope por propuesta. */
  readonly porPresupuesto: number
  /** Gate rojo, correa rota, sin diff: bajas que no son ni veto ni dinero. */
  readonly otrasBajas: number
  readonly detalle?: string
}

export interface DrenajeDeps {
  readonly motor: MotorChainDeps
  /** El operador dijo basta. Se consulta antes y despues de cada vuelta. */
  readonly cancelado: () => boolean
  /** Dolares gastados en esta sesion de drenaje. */
  readonly gastado: () => number
  readonly maxVueltas: number
  readonly costCapUsd: number
}
