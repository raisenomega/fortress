import { appendMessage } from '@application/chat/chat-history'
import type { AppContext } from '@application/context'
import type { Project } from '@domain/project/project'
import { ok, type Result } from '@domain/shared/result'
import { parseSelfNotes } from '@domain/system/self-notes'

/**
 * Cierra una reparacion con exito: lo que el agente descubrio de FORTRESS mismo
 * va al backlog de auto-mejora (etiquetado con el proyecto, no es un hallazgo
 * del proyecto) y su trabajo se persiste para sobrevivir al reinicio.
 */
export function finishRepair(
  context: AppContext,
  project: Project,
  known: readonly string[],
  replyText: string
): Result<void> {
  for (const nota of parseSelfNotes(replyText, project.name)) context.selfObservations.add(nota)
  appendMessage(context, {
    projectId: project.id,
    role: 'assistant',
    content: `Reparacion (${known.length} hallazgos):\n\n${replyText}`,
    agentId: null,
    mode: 'autonomo',
    engine: 'claude-code'
  })
  return ok(undefined)
}
