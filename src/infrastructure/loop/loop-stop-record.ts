import type { AppContext } from '@application/context'
import { spentToday } from '@application/settings/read-budget'
import type { LoopStopReason } from '@domain/loop/loop-decision'
import { detalleDeParada, type StopFacts } from '@domain/loop/stop-detail'
import type { LoopBudget } from '@domain/settings/loop-budget'
import { LoopCancelled } from './loop-standby'

/** Lo que se guarda de una parada. Ausente mientras la sesion sigue viva. */
export interface Parada {
  readonly stoppedReason: LoopStopReason
  readonly stoppedReasonDetail?: string
  readonly stoppedAt: string
}

const con = (reason: LoopStopReason, detalle: string | null): Parada => ({
  stoppedReason: reason,
  ...(detalle ? { stoppedReasonDetail: detalle } : {}),
  stoppedAt: new Date().toISOString()
})

/**
 * El estado que explica la parada, leido AL PARAR: el tope vigente es el de
 * ahora, no el que habia al arrancar la sesion hace horas.
 */
export function hechosDeParada(
  context: AppContext,
  budget: LoopBudget,
  cyclesDone: number,
  baseline: number
): StopFacts {
  return {
    spentSession: spentToday(context, new Date()) - baseline,
    costCap: budget.costCapUsd,
    cyclesDone,
    maxCycles: budget.maxCycles,
    maxConsecutiveDenials: budget.maxConsecutiveDenials,
    maxConsecutiveNoCandidates: budget.maxConsecutiveNoCandidates
  }
}

/** El ciclo termino por su propia decision: el motivo viene con su cifra. */
export function paradaLimpia(reason: LoopStopReason, hechos: StopFacts): Parada {
  return con(reason, detalleDeParada(reason, hechos))
}

/**
 * Una excepcion tambien es una parada. Antes el catch se la tragaba entera y la
 * sesion quedaba inactiva sin decir por que — indistinguible de un final normal,
 * que es exactamente lo que hay que poder distinguir. Cancelar es una parada
 * limpia y pedida; cualquier otra excepcion es un error, y su mensaje es el
 * detalle mas util que existe de ella.
 */
export function paradaPorFallo(error: unknown): Parada {
  if (error instanceof LoopCancelled) return con('detenido', null)
  return con('error', error instanceof Error ? error.message : String(error))
}
