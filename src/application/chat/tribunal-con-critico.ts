import { buildCriticoPrompt } from '@domain/chat/critico-prompt'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import type { AppContext } from '../context'
import { recordMotorRun } from '../repair/record-motor-run'
import type { Tribunal } from './tribunal-del-turno'

/** Una corrida del critico, vista desde la aplicacion. */
export type CorridaDelCritico =
  | { ok: true; texto: string; runMeta: AnalystRunMeta }
  | { ok: false; error: string; timedOut: boolean; runMeta: AnalystRunMeta }

export interface TribunalDeps {
  readonly context: AppContext
  readonly projectId: string
  readonly cwd: string
  readonly critico: { run(arbol: string, prompt: string): Promise<CorridaDelCritico> }
}

/**
 * El tribunal con UN critico (ADR-096, Fase B).
 *
 * Devuelve una LISTA aunque hoy solo entre un elemento: la pieza del
 * paralelismo llamara N veces y juntara, sin reescribir esto. Que la forma nazca
 * plural es lo que hace que extender sea aditivo.
 *
 * FACTURA como cualquier otro: el critico gasta y consta en `agent_runs` con su
 * propio `agentId`, igual que el productor y OMEGA. Un agente que trabaja sin
 * constar es exactamente lo que ADR-091 §0 llama silencio.
 *
 * Si el critico no deja objecion —no arranco, se colgo, o miro y no encontro
 * nada— la lista sale VACIA y el turno sigue: OMEGA juzga como en la Fase A. El
 * debate que no ocurre no tumba un fix; solo deja de ayudarlo.
 */
export function tribunalConCritico(deps: TribunalDeps): Tribunal {
  return async (cp, plan) => {
    const trabajo = cp.diff?.() ?? null
    if (trabajo === null || trabajo.tocados.length === 0) return []

    const corrida = await deps.critico.run(deps.cwd, buildCriticoPrompt(plan, trabajo.diffText))

    const { context, projectId } = deps
    recordMotorRun(context, projectId, 'critico', corrida.runMeta, !corrida.ok)

    return corrida.ok ? [corrida.texto] : []
  }
}
