import type { Assistant } from '@domain/chat/assistant'
import type { ChatEngine } from '@domain/chat/code-agent'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import type { StepProgress } from '../workflow/step-progress'
import type { Reintento } from './ciclo-de-convergencia'
import { produceReply } from './produce-reply'
import type { ReplyOutcome } from './reply-outcome'
import type { SendMessageInput } from './send-message-types'

export interface ProductorDeps {
  readonly context: AppContext
  readonly assistant: Assistant | null
  readonly codeAgent: CodeAgent
  readonly project: Project
  readonly input: SendMessageInput
  readonly foco: HallazgoAResolver | null
  readonly mode: OperationMode
  readonly engine: ChatEngine
  readonly onStep: (progress: StepProgress) => void
  readonly isCancelled: () => boolean
  readonly onChunk: (delta: string) => void
  /** Cuantos agentes intervienen (ADR-097): baja hasta la barra del operador. */
  readonly agentes: number
}

/** El reintento reanuda la sesion del intento anterior; el primero usa la que ya
 *  tuviera el hallazgo. La sesion NUNCA entra al prompt: va al CLI (`--resume`). */
export function enFocoDelIntento(
  foco: HallazgoAResolver | null,
  r: Reintento | null
): HallazgoAResolver | null {
  if (foco === null) return null
  return r === null ? foco : { ...foco, sesion: r.sesion }
}

/**
 * Quien produce el turno, y quien lo vuelve a producir cuando OMEGA veta.
 *
 * Un reintento NO es un turno nuevo: es el MISMO productor, con su sesion
 * reanudada y la objecion como mensaje siguiente (ADR-088 Enmienda 2). Por eso
 * lo unico que cambia entre intentos es el prompt y la sesion del foco; todo lo
 * demas —proyecto, modo, motor, hallazgo— es identico, que es lo que hace que el
 * segundo intento sea una RESPUESTA al primero y no otro disparo a ciegas.
 */
export function productorDelTurno(
  deps: ProductorDeps
): (r: Reintento | null) => Promise<ReplyOutcome> {
  const { context, assistant, codeAgent, project, input, mode, engine } = deps
  return (r) =>
    produceReply({
      ...{ context, assistant, codeAgent, project, mode, engine },
      onStep: deps.onStep,
      isCancelled: deps.isCancelled,
      input: r === null ? input : { ...input, prompt: r.pedido },
      excludedAgents: input.excludedAgents,
      enFoco: enFocoDelIntento(deps.foco, r),
      agentes: deps.agentes,
      onChunk: deps.onChunk
    })
}
