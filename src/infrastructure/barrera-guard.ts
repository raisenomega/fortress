import type { AppContext } from '@application/context'
import { esAutonomoDeVerdad } from '@application/settings/modo-guardado'
import { asentarNotas } from '@application/system/asentar-notas'
import { observacionesDeBarreras } from '@domain/project/observacion-de-barrera'
import { isClaudeInstalled } from './claude-code/claude-cli'
import { barrerasDelProyecto } from './project/barreras-del-proyecto'

export const BARRERA_ROTA =
  'Este proyecto declara una barrera PreToolUse que no puede arrancar: su ' +
  'interprete no existe, asi que el hook no se ejecuta y lo que protege queda ' +
  'sin proteger. Ningun turno que EDITA corre sin esa proteccion (ADR-105). ' +
  'Arregla el interprete en .claude/settings.json; en el chat, supervisado ' +
  'no edita y pasa.'

/**
 * FAIL-CLOSED (ADR-105): ningun turno que EDITA corre sobre un proyecto cuya
 * barrera declarada esta muerta. La barrera del cliente protege lo irreversible
 * —una migracion de produccion, un invariante de tenant—; editar con el hook
 * caido seria ejecutar con la red pintada en el suelo: el proyecto cree tener
 * guardia, FORTRESS sabe que no, y edita igual.
 *
 * Una sola guarda para las tres entradas, y lo que decide es `edita`, que lo
 * pone quien llama porque solo el sabe si su turno toca el disco:
 * - Chat (`chat-send-handler`): turno suelto, lote o workflow, todos por la
 *   misma puerta y sin distinguirlos. `editaElChat`: modo de la BASE (nunca
 *   `input.mode`: el turno de plan del lote manda `supervisado` a proposito) Y
 *   turno por el CLI; por API no toca el disco.
 * - Ejecutor de Construir (`run-build`): edita SIEMPRE (acceptEdits sin nadie
 *   delante), asi que pasa `true` y se niega sea cual sea el modo.
 *
 * Dos decisiones que siguen en pie desde la version que solo cubria el lote:
 * (1) LA OBSERVACION SE ASIENTA SIEMPRE, bloquee o no: en supervisado decide el
 *     humano, pero el backlog se entera igual. Por eso va la PRIMERA de las
 *     guardas del chat: detras de `guardPlanAprobado` un lote sin visto bueno
 *     saldria sin haber mirado nunca la barrera.
 * (2) ANTES de `guardRun`, que RESERVA el carril: negar despues de reservar lo
 *     dejaria tomado para siempre.
 */
export function guardBarrera(
  context: AppContext,
  projectId: string,
  edita: boolean
): string | null {
  const project = context.projects.findById(projectId)
  if (project === null) return null

  const rotas = barrerasDelProyecto(project.path)
  if (rotas.length === 0) return null

  asentarNotas(context, project, observacionesDeBarreras(rotas))

  return edita ? BARRERA_ROTA : null
}

/** El chat edita si el proyecto corre en autonomo (base) y el turno ira por el CLI. */
export function editaElChat(
  context: AppContext,
  porCli: () => boolean = isClaudeInstalled
): boolean {
  return esAutonomoDeVerdad(context) && porCli()
}
