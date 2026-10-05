import type { ChatMessage } from '@domain/chat/chat-message'
import type { CodeAgent } from '@domain/chat/code-agent'
import { buildConfigurationPrompt } from '@domain/chat/configuration-prompt'
import type { Project } from '@domain/project/project'
import { textOnly, type ReplyOutcome } from './reply-outcome'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'

export interface ConfigReplyOptions {
  readonly codeAgent: CodeAgent
  readonly project: Project
  readonly history: readonly ChatMessage[]
  readonly onChunk: (delta: string) => void
}

/**
 * Un turno de la entrevista: el agente corre en 'lectura' (solo lectura, sin
 * Bash, y con el grafo respondiendo: en 'plan' el MCP entero quedaba bloqueado)
 * con el prompt rector + la conversacion. Nunca escribe; la app captura los
 * borradores del texto de la respuesta con parseDocBlocks.
 */
export async function replyFromConfiguration(options: ConfigReplyOptions): Promise<ReplyOutcome> {
  if (!options.codeAgent.isAvailable()) {
    return textOnly('Necesitas Claude Code instalado para configurar el proyecto.')
  }
  // Igual que el camino normal (chooseEngine): un cwd inexistente (carpeta movida)
  // debe dar un motivo legible, no un "spawn claude ENOENT" confuso.
  const problem = options.codeAgent.precheck(options.project.path)
  if (problem) return textOnly(problem)

  const reply = await options.codeAgent.run(
    {
      projectPath: options.project.path,
      projectId: options.project.id,
      prompt: buildConfigurationPrompt(options.history, options.project.name),
      permissionMode: 'lectura',
      agentId: null, model: MODELO_POR_ROL.configuracion,
      trusted: false
    },
    options.onChunk
  )
  if (reply.failed) {
    return textOnly(reply.text || 'La entrevista de configuracion se interrumpio.', reply.usage)
  }
  return textOnly(reply.text, reply.usage)
}
