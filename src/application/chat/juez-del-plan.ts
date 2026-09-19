import { parsePlanResponse } from '@domain/chat/plan-parse'
import { buildPlanPrompt } from '@domain/chat/plan-prompt'
import type { JuicioDelPlan } from '@domain/chat/juicio-del-plan'
import type { AppContext } from '../context'
import { recordMotorRun } from '../repair/record-motor-run'
import { lineasDelLote } from './hallazgos-del-lote'
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
 * Recibe los IDS del lote, no los hallazgos ya escritos, y los relee el mismo
 * con `lineasDelLote` (ADR-097 ENMIENDA 1). Por lo de siempre: una lista que le
 * llega hecha es una lista que quien llama pudo componer, y lo que se juzga
 * tiene que salir de la base. De paso lee LA MISMA lista que leyo el productor
 * al escribir el plan (`lista-del-turno.ts:22`), que es lo que hace que el
 * veredicto signifique algo: juzga la direccion sobre el conjunto que la motivo.
 *
 * `null` cuando no se pudo juzgar —el agente no arranco, o su respuesta no se
 * dejo leer—. NO se inventa un ADELANTE: aprobar por no haber podido mirar
 * seria justo lo contrario de lo que este filtro existe para hacer. Un lote sin
 * ningun hallazgo vivo cae ahi mismo, antes de gastar una corrida: si no queda
 * nada que juzgar tampoco hay nada que aprobar, y la puerta sigue cerrada.
 */
export function juezDelPlan(deps: JuezDelPlanDeps) {
  return async (ids: readonly string[], propuesta: string): Promise<JuicioDelPlan | null> => {
    const hallazgos = lineasDelLote(deps.context, deps.projectId, ids)
    if (hallazgos.length === 0) return null

    const corrida = await deps.omega.run(deps.cwd, buildPlanPrompt(hallazgos, propuesta))

    const leido = corrida.ok ? parsePlanResponse(corrida.texto) : { error: corrida.error }
    const fallo = 'error' in leido
    recordMotorRun(deps.context, deps.projectId, 'sentinel-omega', corrida.runMeta, fallo)

    return fallo ? null : leido.juicio
  }
}
