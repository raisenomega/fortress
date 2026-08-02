import type { Assistant } from '@domain/chat/assistant'
import type { ChatEngine, CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'
import type { AppContext } from '../context'
import { replyFromApi } from './reply-from-api'
import { runCodeAgent } from './run-code-agent'
import type { SendMessageInput } from './send-message-types'

export interface ReplyOptions {
  readonly context: AppContext
  readonly assistant: Assistant | null
  readonly codeAgent: CodeAgent
  readonly project: Project
  readonly input: SendMessageInput
  readonly mode: OperationMode
  readonly engine: ChatEngine
  readonly onChunk: (delta: string) => void
}

/** Produce el texto con el motor elegido: CLI real o API de solo texto. */
export function produceReply(options: ReplyOptions): Promise<string> {
  const { context, assistant, codeAgent, project, input, mode, engine, onChunk } = options

  if (engine === 'claude-code') {
    return runCodeAgent(codeAgent, project, input.prompt, mode, onChunk).then(
      (outcome) => outcome.text
    )
  }

  return replyFromApi({
    context,
    assistant: assistant as Assistant,
    project,
    enabledAgents: input.enabledAgents,
    mode,
    onChunk
  })
}
