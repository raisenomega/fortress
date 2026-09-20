import type { SendMessageInput } from '@application/chat/send-message-types'
import type { AppContext } from '@application/context'
import { esAutonomoDeVerdad } from '@application/settings/modo-guardado'
import { asentarNotas } from '@application/system/asentar-notas'
import { observacionesDeBarreras } from '@domain/project/observacion-de-barrera'
import { barrerasDelProyecto } from './project/barreras-del-proyecto'
import { ejecutaUnLote } from './plan-guard'

export const BARRERA_ROTA =
  'Este proyecto declara una barrera PreToolUse que no puede arrancar: su ' +
  'interprete no existe, asi que el hook no se ejecuta y lo que protege queda ' +
  'sin proteger. En autonomo el lote no corre sin esa proteccion. Arregla el ' +
  'interprete en .claude/settings.json, o ejecuta el lote en supervisado.'

/**
 * FAIL-CLOSED: en autonomo, un lote NO corre sobre un proyecto cuya barrera
 * declarada esta muerta.
 *
 * El porque, en una frase: la barrera del cliente protege lo irreversible —una
 * migracion de produccion, un invariante de tenant— y el autonomo es justo el
 * modo donde nadie mira. Seguir seria ejecutar con la red pintada en el suelo:
 * el proyecto cree tener guardia, FORTRESS sabe que no, y edita igual.
 *
 * TRES DECISIONES, y ninguna es un descuido:
 *
 * (1) LA OBSERVACION SE ASIENTA SIEMPRE, bloquee o no. Lo que se aprende no
 * depende de si esta vez se iba a editar; en supervisado hay un humano delante y
 * la decision es suya, pero el backlog se entera igual. Por eso esta guarda va la
 * PRIMERA de las tres: si fuera detras de `guardPlanAprobado`, un lote sin visto
 * bueno saldria sin haber mirado nunca la barrera.
 *
 * (2) ANTES DE `guardRun`, que RESERVA el carril: negar despues de reservar lo
 * dejaria tomado para siempre. Misma razon que `guardPlanAprobado`.
 *
 * (3) EL MODO SALE DE LA BASE (`esAutonomoDeVerdad`) y nunca de `input.mode`. El
 * turno de plan del lote manda `supervisado` a proposito aunque el proyecto corra
 * en autonomo; fiarse del mensaje seria preguntarle al que quiere pasar si tiene
 * permiso.
 *
 * LO QUE NO CUBRE, dicho aqui y no en un ADR: un turno SUELTO en autonomo
 * tambien edita y esta guarda lo deja pasar, porque lo que se decidio bloquear
 * fue el lote. La costura esta puesta para ampliarlo —quitar `ejecutaUnLote` es
 * una linea— y no se amplia sin decidirlo.
 */
export function guardBarrera(context: AppContext, input: SendMessageInput): string | null {
  const project = context.projects.findById(input.projectId)
  if (project === null) return null

  const rotas = barrerasDelProyecto(project.path)
  if (rotas.length === 0) return null

  asentarNotas(context, project, observacionesDeBarreras(rotas))

  return ejecutaUnLote(input) && esAutonomoDeVerdad(context) ? BARRERA_ROTA : null
}
