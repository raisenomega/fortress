import type { LoopStatus } from '@domain/loop/loop-status'
import type { ChainOutcome } from '../repair/motor-chain-outcome'

/** Lo fijo de una sesion de loop. */
export interface LoopConfig {
  readonly projectId: string
  readonly costCap: number
  readonly maxCycles: number
}

/**
 * Todo lo real del ciclo, inyectado: escaneo, arreglo, reloj de gasto,
 * cancelacion, timers y reporte. Con dobles se prueba el ciclo entero sin
 * lanzar un solo proceso.
 *
 * Ya no hay red git ni verificacion aqui: el arreglo se compila, se prueba y se
 * juzga dentro de su worktree, y este arbol no se toca hasta que se integra.
 */
export interface LoopDeps {
  /** Escanea y devuelve el score (0-100). */
  readonly scan: () => Promise<number>
  /**
   * Fase de reparacion: una vuelta del motor. Devuelve DONDE acabo, que es lo
   * que distingue una vuelta que cerro una propuesta de una que no encontro
   * nada que reparar.
   */
  readonly fix: () => Promise<ChainOutcome>
  /** Gasto acumulado de la sesion de loop, en dolares. */
  readonly spentSession: () => number
  /**
   * Denegaciones seguidas que se toleran. Se relee en cada vuelta, como el
   * gasto: una sesion dura horas y el operador puede ajustar el tope mientras
   * corre. Congelarlo al arrancar dejaria al loop obedeciendo ajustes viejos.
   */
  readonly maxConsecutiveDenials: () => number
  /** Integraciones que se acumulan antes de re-escanear. Tambien se relee. */
  readonly rescanEvery: () => number
  /** Vueltas en vacio que se toleran antes de dar la baraja por agotada. */
  readonly maxConsecutiveNoCandidates: () => number
  /** Fixes descartados seguidos que se toleran antes de admitir el no-avance. */
  readonly maxConsecutiveDiscarded: () => number
  /** El humano intervino (toggle OFF / Detener). */
  readonly isCancelled: () => boolean
  readonly wait: (ms: number) => Promise<void>
  readonly emit: (status: LoopStatus) => void
  /** Persiste el progreso para reanudar tras un reinicio. Nada se pierde. */
  readonly persist: (recentScores: readonly number[], cyclesDone: number) => void
}
