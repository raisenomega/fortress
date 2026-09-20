import { esAutonomoDeVerdad } from '@application/settings/modo-guardado'
import type { SendMessageInput } from '@application/chat/send-message-types'
import type { AppContext } from '@application/context'
import { hallazgoAprobado } from './aprobacion-del-plan'

export const SIN_APROBACION =
  'Este hallazgo es de un lote y el plan no tiene el visto bueno de OMEGA. ' +
  'En autonomo el lote se ejecuta cuando OMEGA aprueba la direccion; sin eso ' +
  'no se toca nada.'

/** Un turno que EJECUTA un hallazgo del lote: lleva el foco y la lista. El
 *  turno de PLAN trae la lista sin foco, y no edita nada — ese no pasa por
 *  aqui. Un turno suelto no trae lista. */
export const ejecutaUnLote = (input: SendMessageInput): boolean =>
  (input.lote ?? []).length > 0 && input.findingId !== undefined

/**
 * INNEGOCIABLE (ADR-097 §4): en autonomo es IMPOSIBLE ejecutar un hallazgo del
 * lote sin que OMEGA haya aprobado el plan. No «se desaconseja»: no corre.
 *
 * Vive en el MAIN, junto a `guardRun`, y por lo mismo: el renderer puede pedir
 * lo que quiera, pero quien ejecuta es este proceso y este proceso se niega. Es
 * la familia de `toRunInsert` (todo INSERT pasa por ahi), `AUDIT_AGENTS` (el
 * repo no pisa al critico) y la guarda de `arbitrar` (lo que no se juzga no se
 * critica): la defensa donde no se puede esquivar.
 *
 * El modo sale de `modoGuardado` —la BASE— y NUNCA de `input.mode`. El turno de
 * plan del lote manda `mode: 'supervisado'` a proposito aunque el proyecto
 * corra en autonomo; fiarse del mensaje seria preguntarle al que quiere pasar
 * si tiene permiso.
 *
 * En supervisado no aplica: alli el aprobador es el operador y su Enter ES la
 * autorizacion (ADR-088, arco 1). Esta puerta ocupa esa silla solo cuando el
 * operador no esta.
 */
export function guardPlanAprobado(context: AppContext, input: SendMessageInput): string | null {
  if (!ejecutaUnLote(input)) return null
  if (!esAutonomoDeVerdad(context)) return null

  return hallazgoAprobado(input.projectId, input.findingId as string) ? null : SIN_APROBACION
}
