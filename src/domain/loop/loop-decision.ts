/**
 * Por que se detuvo el loop. La UI lo traduce (ver STOP_LABEL en loop-status).
 * 'build-roto' y 'degradado' no los devuelve loopStop (no son estados): los
 * emite el ciclo cuando el arreglo deja el arbol roto, o cuando baja el score.
 */
export type LoopStopReason =
  | 'detenido'
  | 'tope-gasto'
  | 'tope-ciclos'
  | 'tope-denegaciones'
  | 'resuelto'
  | 'build-roto'
  | 'degradado'
  | 'sin-solucion'

export interface LoopState {
  /** El humano intervino (toggle OFF / boton Detener). Manda sobre todo. */
  readonly cancelled: boolean
  /** Gasto acumulado de la sesion de loop, en dolares. */
  readonly spentSession: number
  readonly costCap: number
  /** Propuestas cerradas en esta sesion. */
  readonly cyclesDone: number
  readonly maxCycles: number
  /** Propuestas SEGUIDAS que la politica denego sin integrar. */
  readonly consecutiveDenials: number
  readonly maxConsecutiveDenials: number
  /** Scores de los ultimos escaneos, del mas reciente al mas antiguo. */
  readonly recentScores: readonly number[]
}

/** Escaneos 100/100 SEGUIDOS que se consideran "arco resuelto". */
export const SOLVED_STREAK = 3

/**
 * Cuantos escaneos 100/100 van SEGUIDOS desde el mas reciente (tope: SOLVED_STREAK).
 * Un score < 100 rompe la racha: tienen que ser consecutivos, no aislados.
 */
export function solvedStreak(scores: readonly number[]): number {
  let n = 0
  for (const score of scores) {
    if (score !== 100) break
    n += 1
    if (n >= SOLVED_STREAK) break
  }
  return n
}

function solved(scores: readonly number[]): boolean {
  return solvedStreak(scores) >= SOLVED_STREAK
}

/**
 * El motivo por el que el loop debe PARAR, o null si puede seguir. El orden es
 * la prioridad de seguridad: la intervencion humana y los frenos de coste
 * mandan sobre la meta de resolver. Es el unico sitio que decide parar.
 */
export function loopStop(state: LoopState): LoopStopReason | null {
  if (state.cancelled) return 'detenido'
  if (state.spentSession >= state.costCap) return 'tope-gasto'
  if (state.cyclesDone >= state.maxCycles) return 'tope-ciclos'
  if (solved(state.recentScores)) return 'resuelto'
  // Va DETRAS de resuelto: llegar a 100 tres veces seguidas es haber terminado,
  // y no tiene sentido anunciar un desencaje de politica sobre un arco cerrado.
  if (state.consecutiveDenials >= state.maxConsecutiveDenials) return 'tope-denegaciones'
  return null
}
