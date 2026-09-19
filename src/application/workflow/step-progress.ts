import type { FaseDelTurno } from '@domain/chat/fase-del-turno'
/** Avance de un workflow para la UI: cuantos agentes, tokens y coste hasta ahora. */
export interface StepProgress {
  /** Indice del paso que arranca (0-based). */
  readonly index: number
  readonly total: number
  readonly tokens: number
  readonly costUsd: number
  /** Que esta haciendo el turno, si es algo que el operador debe ver (ADR-097).
   *  Ausente = el medidor de siempre: tiempo, tokens y coste. */
  readonly fase?: FaseDelTurno
}
