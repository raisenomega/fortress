/**
 * Por que se detuvo el loop. La UI lo traduce (ver STOP_LABEL en loop-status).
 * 'build-roto' no lo devuelve loopStop (no es un estado): lo emite el ciclo
 * cuando el arreglo deja el arbol roto y se revierte.
 */
export type LoopStopReason = 'detenido' | 'tope-gasto' | 'tope-ciclos' | 'resuelto' | 'build-roto'

export interface LoopState {
  /** El humano intervino (toggle OFF / boton Detener). Manda sobre todo. */
  readonly cancelled: boolean
  /** Gasto acumulado de la sesion de loop, en dolares. */
  readonly spentSession: number
  readonly costCap: number
  /** Ciclos completados en esta sesion. */
  readonly cyclesDone: number
  readonly maxCycles: number
  /** Scores de los ultimos escaneos, del mas reciente al mas antiguo. */
  readonly recentScores: readonly number[]
}

/** Escaneos 100/100 seguidos que se consideran "arco resuelto". */
const SOLVED_STREAK = 3

function solved(scores: readonly number[]): boolean {
  if (scores.length < SOLVED_STREAK) return false
  return scores.slice(0, SOLVED_STREAK).every((score) => score === 100)
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
  return null
}
