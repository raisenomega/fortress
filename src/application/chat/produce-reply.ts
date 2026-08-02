import type { AgentId } from '@domain/agent/agent'
import type { Assistant } from '@domain/chat/assistant'
import type { ChatEngine, CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { AppContext } from '../context'
import type { ReplyOutcome } from './reply-outcome'
import { replyFromApi } from './reply-from-api'
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
  /** Progreso del workflow, paso a paso. */
  readonly onStep: (index: number, total: number) => void
  readonly onChunk: (delta: string) => void
}

/** Produce el texto con el motor elegido: CLI real o API de solo texto. */
export function produceReply(options: ReplyOptions): Promise<ReplyOutcome> {
  const { assistant, codeAgent, project, input, mode, engine, onChunk } = options

  if (engine === 'claude-code') {
    return replyFromWorkflow({
      codeAgent,
      project,
      prompt: input.prompt,
      mode,
      excludedAgents: options.excludedAgents,
      onStep: options.onStep,
      onChunk
    })
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
