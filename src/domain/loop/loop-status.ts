import type { LoopStopReason } from './loop-decision'

/**
 * En que fase del ciclo esta el loop, para pintarlo en vivo. 'standby' = un
 * fallo transitorio (API/credito/red) lo tiene en pausa, esperando recuperarse.
 */
export type LoopPhase =
  'escaneando' | 'esperando' | 'reparando' | 'verificando' | 'debate' | 'standby' | 'parado'

/** Estado del loop que el main empuja al renderer en cada transicion. */
export interface LoopStatus {
  readonly projectId: string
  readonly phase: LoopPhase
  readonly cycle: number
  readonly maxCycles: number
  /** Ultimo score conocido, o null si aun no se ha escaneado. */
  readonly score: number | null
  readonly spentSession: number
  readonly costCap: number
  /** Escaneos 100/100 SEGUIDOS logrados (0-3): al llegar a 3 el arco se resuelve. */
  readonly solvedStreak: number
  /** Motivo si ya paro, o null si sigue. */
  readonly stopReason: LoopStopReason | null
}

/** Texto que ve el operador para cada motivo de parada. */
export const STOP_LABEL: Record<LoopStopReason, string> = {
  detenido: 'Detenido por intervencion humana',
  'tope-gasto': 'Alcanzado el tope de gasto de la sesion',
  'tope-ciclos': 'Alcanzado el maximo de propuestas',
  resuelto: 'Resuelto: 3 escaneos 100/100 seguidos',
  'build-roto': 'Un arreglo rompio el build: revertido y detenido',
  degradado: 'Un arreglo bajo el score: revertido y detenido',
  'sin-solucion': 'El debate no hallo una mejora: revertido y detenido'
}
