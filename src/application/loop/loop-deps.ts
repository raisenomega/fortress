import type { LoopStatus } from '@domain/loop/loop-status'
import type { ChainOutcome } from '../repair/motor-chain-outcome'

/** Lo fijo de una sesion de loop. */
export interface LoopConfig {
  readonly projectId: string
  readonly costCap: number
  readonly maxCycles: number
}

/**
 * Todo lo real del ciclo, inyectado: escaneo, arreglo, verificacion, git,
 * reloj de gasto, cancelacion, timers y reporte. Con dobles se prueba el ciclo
 * entero sin lanzar un solo proceso.
 */
export interface LoopDeps {
  /** Escanea y devuelve el score (0-100). */
  readonly scan: () => Promise<number>
  /**
   * Fase de reparacion: una vuelta del motor. attempt>0 es una ronda del debate.
   * Devuelve DONDE acabo la vuelta; el ciclo aun no lo mira, pero sin este dato
   * no se puede contar propuestas cerradas ni denegaciones seguidas.
   */
  readonly fix: (attempt: number) => Promise<ChainOutcome>
  /** Verifica el arbol tras reparar. false = build roto. */
  readonly verify: () => Promise<boolean>
  /** Checkpoint (git) antes de reparar. */
  readonly snapshot: () => Promise<void>
  /** Revierte al ultimo checkpoint si el build quedo roto. */
  readonly revert: () => Promise<void>
  /** Gasto acumulado de la sesion de loop, en dolares. */
  readonly spentSession: () => number
  /** El humano intervino (toggle OFF / Detener). */
  readonly isCancelled: () => boolean
  readonly wait: (ms: number) => Promise<void>
  readonly emit: (status: LoopStatus) => void
  /** Persiste el progreso para reanudar tras un reinicio. Nada se pierde. */
  readonly persist: (recentScores: readonly number[], cyclesDone: number) => void
}
