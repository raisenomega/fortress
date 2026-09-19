import type { IpcMainInvokeEvent } from 'electron'
import { sendMessage } from '@application/chat/send-message'
import type { SendMessageInput, SendMessageOutput } from '@application/chat/send-message-types'
import type { AppContext } from '@application/context'
import { ok, type Result } from '@domain/shared/result'
import { isCancelled } from '../run-control'
import { isFortressRepo } from '../system/self-project'
import { criticoDelTerminal } from '../chat/critico-del-terminal'
import { juzgarElPlanDelLote } from '../chat/juicio-del-plan-del-turno'
import { omegaDelTerminal } from '../chat/omega-del-terminal'
import { RED_DE_REVERSION } from '../chat/red-de-reversion'
import { buildChatEngines } from './chat-engines'
import { chunkSender, progressSender } from './chat-send-senders'
import { conFocoSaneado } from './foco-pedido'

/**
 * El trabajo del turno, ya pasadas las dos puertas: armar los motores, correr el
 * turno, y juzgar el plan si lo hubo.
 *
 * Aparte de `chat-send-handler` SOLO por tamano, y las GUARDAS SE QUEDAN ALLI a
 * proposito. Llevarselas aqui compilaba igual y rompia dos lecturas del repo:
 * `guards-del-codigo` sigue a los ayudantes del MISMO fichero, asi que habria
 * dejado de ver el `guardRun` de `chat:send` —y la tabla de docs/IPC.md habria
 * quedado «mintiendo» por el lado peor, diciendo que hay guard donde el lector
 * automatico ya no lo encuentra—; y `alcance-del-embudo` cuenta el `catch` POR
 * FICHERO, asi que los dos canales del chat habrian pasado a contarse como
 * observados sin serlo. La costura correcta era esta: arriba quien decide si se
 * pasa, aqui lo que se hace una vez dentro.
 */
export async function turnoConJuicio(
  context: AppContext,
  input: SendMessageInput,
  event: IpcMainInvokeEvent
): Promise<Result<SendMessageOutput>> {
  const { codeAgent, assistant } = buildChatEngines(context)
  const progreso = progressSender(event, input.projectId)
  // El MISMO corredor para el tribunal del fix y para el juicio del plan: dos
  // momentos del turno, una sola forma de lanzar a quien mira.
  const critico = criticoDelTerminal(input.projectId)

  const hecho = await sendMessage(
    context,
    assistant,
    codeAgent,
    conFocoSaneado(input),
    chunkSender(event, input.projectId),
    progreso,
    () => isCancelled(input.projectId),
    isFortressRepo,
    RED_DE_REVERSION,
    omegaDelTerminal(input.projectId),
    critico
  )
  if (!hecho.ok) return hecho

  // La OTRA MITAD de la puerta de arriba: el unico camino que la abre. Aqui y no
  // en `sendMessage` porque necesita la prosa que el turno acaba de producir —
  // antes de terminar, ese plan no existe (ADR-097 §3).
  const propuesta = hecho.value.assistant.content
  const plan = await juzgarElPlanDelLote({ context, input, propuesta, avisar: progreso, omega: critico }) // prettier-ignore
  return ok({ ...hecho.value, plan })
}
