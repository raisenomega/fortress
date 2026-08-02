import type { CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import type { OperationMode } from '@domain/settings/operation-mode'
import { permissionModeFor } from '@domain/settings/permission-mode'

import type { ReplyOutcome } from './reply-outcome'

/**
 * Lanza el agente dentro de la carpeta del proyecto. El modo de FORTRESS
 * decide sus permisos: en supervisado solo lee y propone, en autonomo puede
 * editar. Lo que el permiso bloquee se anade al final de la respuesta, para
 * que el operador vea lo que el agente quiso hacer y no pudo.
 */
export async function runCodeAgent(
  agent: CodeAgent,
  project: Project,
  prompt: string,
  mode: OperationMode,
  onChunk: (delta: string) => void
): Promise<ReplyOutcome> {
  const reply = await agent.run(
    { projectPath: project.path, prompt, permissionMode: permissionModeFor(mode) },
    onChunk
  )

  const traza = { usage: reply.usage, tools: reply.tools, edits: reply.edits }
  if (reply.denials.length === 0) {
    return { text: reply.text, failed: reply.failed, ...traza }
  }

  const aviso =
    `\n\n---\nBloqueado por el modo ${mode} (${reply.denials.length}):\n` +
    reply.denials.map((denial) => `- ${denial}`).join('\n')

  return { text: reply.text + aviso, failed: reply.failed, ...traza }
}
