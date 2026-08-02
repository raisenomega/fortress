import type { Assistant } from '@domain/chat/assistant'
import type { ChatEngine, CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { err, ok, type Result } from '@domain/shared/result'

const NO_ENGINE =
  'No hay forma de responder: instala Claude Code para que el agente ejecute en ' +
  'el proyecto, o configura una API key en Configuracion para chat de solo texto.'

/**
 * Con el CLI instalado el agente ejecuta de verdad dentro del proyecto; si no,
 * la API responde solo con texto, sin acceso a archivos.
 *
 * Se decide ANTES de guardar nada: un envio que no puede prosperar no debe
 * dejar a medias el historial del proyecto.
 */
export function chooseEngine(
  codeAgent: CodeAgent,
  assistant: Assistant | null,
  project: Project
): Result<ChatEngine> {
  if (codeAgent.isAvailable()) {
    const problem = codeAgent.precheck(project.path)
    return problem ? err(problem) : ok('claude-code')
  }

  return assistant ? ok('api') : err(NO_ENGINE)
}
