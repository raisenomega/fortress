import type { ChatMessage } from '@domain/chat/chat-message'
import type { CodeAgent } from '@domain/chat/code-agent'
import { buildConfigurationPrompt } from '@domain/chat/configuration-prompt'
import type { Project } from '@domain/project/project'
import { textOnly, type ReplyOutcome } from './reply-outcome'

export interface ConfigReplyOptions {
  readonly codeAgent: CodeAgent
  readonly project: Project
  readonly history: readonly ChatMessage[]
  readonly onChunk: (delta: string) => void
}

/**
 * Un turno de la entrevista: el agente corre en 'plan' (SOLO LECTURA) con el
 * prompt rector + la conversacion. Nunca escribe; la app captura los borradores
 * del texto de la respuesta con parseDocBlocks.
 */
export async function replyFromConfiguration(options: ConfigReplyOptions): Promise<ReplyOutcome> {
  if (!options.codeAgent.isAvailable()) {
    return textOnly('Necesitas Claude Code instalado para configurar el proyecto.')
  }

  const reply = await options.codeAgent.run(
    {
      projectPath: options.project.path,
      prompt: buildConfigurationPrompt(options.history, options.project.name),
      permissionMode: 'plan',
      agentId: null,
      trusted: false
    },
    options.onChunk
  )
  return textOnly(reply.text, reply.usage)
}
