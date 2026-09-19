import { parsePlanResponse } from '@domain/chat/plan-parse'
import { buildPlanPrompt } from '@domain/chat/plan-prompt'
import type { JuicioDelPlan } from '@domain/chat/juicio-del-plan'
import type { HallazgoJuzgado } from '@domain/repair/hallazgo-juzgado'
import type { AppContext } from '../context'
import { recordMotorRun } from '../repair/record-motor-run'
import type { CorridaDelCritico } from './tribunal-con-critico'

export interface JuezDelPlanDeps {
  readonly context: AppContext
  readonly projectId: string
  readonly cwd: string
  /** El mismo corredor que el critico: `claude -p` que devuelve texto. */
  readonly omega: { run(arbol: string, prompt: string): Promise<CorridaDelCritico> }
}

/**
 * OMEGA sobre la DIRECCION de un plan, antes de tocar nada (ADR-097 §2).
 *
 * Reusa el CORREDOR del critico y no el de OMEGA-del-fix, y no es un descuido:
 * aquel parsea un bloque `VERDICT` y aqui el bloque es `PLAN`. Lo que se reusa
 * es lo neutro —lanzar el proceso y devolver texto—; lo que encarna el rol
 * —prompt y vocabulario— es propio. La misma regla que siguio el critico.
 *
 * FACTURA como cualquier otro: juzgar un plan cuesta y consta en `agent_runs`.
 * Un juicio que no se factura es un juicio que no existio para las cuentas.
 *
 * `null` cuando no se pudo juzgar —el agente no arranco, o su respuesta no se
 * dejo leer—. NO se inventa un ADELANTE: aprobar por no haber podido mirar
 * seria justo lo contrario de lo que este filtro existe para hacer.
 */
export function juezDelPlan(deps: JuezDelPlanDeps) {
  return async (plan: HallazgoJuzgado, propuesta: string): Promise<JuicioDelPlan | null> => {
    const corrida = await deps.omega.run(deps.cwd, buildPlanPrompt(plan, propuesta))

    const leido = corrida.ok ? parsePlanResponse(corrida.texto) : { error: corrida.error }
    const fallo = 'error' in leido
    recordMotorRun(deps.context, deps.projectId, 'sentinel-omega', corrida.runMeta, fallo)

    return fallo ? null : leido.juicio
  }
}
