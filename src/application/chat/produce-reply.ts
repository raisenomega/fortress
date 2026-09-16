import type { StepProgress } from '../workflow/step-progress'
import type { AgentId } from '@domain/agent/agent'
import type { Assistant } from '@domain/chat/assistant'
import type { ChatEngine, CodeAgent } from '@domain/chat/code-agent'
import { formatearHallazgo, type HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { AppContext } from '../context'
import { listaDelTurno } from './lista-del-turno'
import type { ReplyOutcome } from './reply-outcome'
import { replyFromApi } from './reply-from-api'
import { replyFromChat } from './reply-from-chat'
import { replyFromWorkflow } from './reply-from-workflow'
import type { SendMessageInput } from './send-message-types'

export interface ReplyOptions {
  readonly context: AppContext
  readonly assistant: Assistant | null
  readonly codeAgent: CodeAgent
  readonly project: Project
  readonly input: SendMessageInput
  readonly mode: OperationMode
  readonly engine: ChatEngine
  /** Agente que se hace cargo, ya enrutado. */
  /** Agentes excluidos por el operador desde el sidebar. */
  readonly excludedAgents: readonly AgentId[]
  /** El hallazgo que resuelve este turno, ya releido de la base (ADR-088). */
  readonly enFoco?: HallazgoAResolver | null
  /** Progreso del workflow, paso a paso. */
  readonly onStep: (progress: StepProgress) => void
  readonly isCancelled: () => boolean
  readonly onChunk: (delta: string) => void
}

/** Produce el texto con el motor elegido: CLI real o API de solo texto. */
export function produceReply(options: ReplyOptions): Promise<ReplyOutcome> {
  const { assistant, codeAgent, project, input, mode, engine, onChunk } = options

  if (engine === 'claude-code') {
    const foco = options.enFoco ?? null
    const opciones = {
      codeAgent,
      project,
      corpus: options.context.corpus.of(project.path),
      prompt: input.prompt,
      mode,
      excludedAgents: options.excludedAgents,
      onStep: options.onStep,
      isCancelled: options.isCancelled,
      known: listaDelTurno(options.context, project, input, foco),
      // `known` son los hallazgos del lote (plan o hermanos), no el historial.
      deLote: (options.input.lote ?? []).length > 0,
      onChunk
    }
    // Resolver un hallazgo es UN turno, no un workflow de revision: sin esto,
    // «arregla … seguridad» dispararia el pipeline entero (ADR-088, pieza 2).
    // La sesion va aparte del bloque: al CLI como `--resume`, nunca al prompt.
    if (foco !== null) {
      return replyFromChat({ ...opciones, enFoco: formatearHallazgo(foco), sesion: foco.sesion })
    }
    // Lote SIN foco: es el turno de PLAN. Lo produce el productor, no el router,
    // y ve los N del lote en vez del historial del escaneo (ADR-088, arco 1).
    if (opciones.deLote) return replyFromChat(opciones)
    return replyFromWorkflow(opciones)
  }

  return replyFromApi({
    context: options.context,
    assistant: assistant as Assistant,
    project,
    enabledAgents: [],
    mode,
    onChunk
  })
}
