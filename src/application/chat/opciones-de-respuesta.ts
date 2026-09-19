import type { AgentId } from '@domain/agent/agent'
import type { Assistant } from '@domain/chat/assistant'
import type { ChatEngine, CodeAgent } from '@domain/chat/code-agent'
import type { HallazgoAResolver } from '@domain/chat/hallazgo-a-resolver'
import type { CorpusDescriptor } from '@domain/project/corpus-descriptor'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { AppContext } from '../context'
import type { StepProgress } from '../workflow/step-progress'
import type { SendMessageInput } from './send-message-types'

/**
 * Lo que necesita producir una respuesta, en sus dos formas.
 *
 * Vivian cada una en el fichero de su funcion, y `reply-from-chat` importaba la
 * del workflow para extenderla — un camino dependiendo del tipo de otro para
 * decir lo que comparten. Aqui son lo que son: el vocabulario comun de producir
 * una respuesta, que los tres caminos usan y ninguno posee.
 */
export interface WorkflowReplyOptions {
  readonly codeAgent: CodeAgent
  readonly project: Project
  /** Lo que el proyecto documenta, resuelto por el puerto del corpus. */
  readonly corpus: CorpusDescriptor
  readonly prompt: string
  readonly mode: OperationMode
  readonly excludedAgents: readonly AgentId[]
  readonly onStep: (progress: StepProgress) => void
  readonly onChunk: (delta: string) => void
  readonly known: readonly string[]
  readonly isCancelled: () => boolean
  /** Cuantos agentes intervienen en este turno (ADR-097). El workflow lo sabe
   *  por sus pasos; el turno con foco lo recibe, porque el critico y OMEGA
   *  corren DESPUES de que el productor conteste y desde aqui no se ven. */
  readonly agentes?: number
}

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
  /** Cuantos agentes intervienen (ADR-097), para la barra del operador. */
  readonly agentes?: number
  readonly isCancelled: () => boolean
  readonly onChunk: (delta: string) => void
}
