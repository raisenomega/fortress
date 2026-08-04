import type { LoopStopReason } from './loop-decision'

/** En que fase del ciclo esta el loop, para pintarlo en vivo. */
export type LoopPhase = 'escaneando' | 'esperando' | 'reparando' | 'verificando' | 'parado'

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
  /** Motivo si ya paro, o null si sigue. */
  readonly stopReason: LoopStopReason | null
}

/** Texto que ve el operador para cada motivo de parada. */
export const STOP_LABEL: Record<LoopStopReason, string> = {
  detenido: 'Detenido por intervencion humana',
  'tope-gasto': 'Alcanzado el tope de gasto de la sesion',
  'tope-ciclos': 'Alcanzado el maximo de ciclos',
  resuelto: 'Resuelto: 3 escaneos 100/100 seguidos',
  'build-roto': 'Un arreglo rompio el build: revertido y detenido'
}
