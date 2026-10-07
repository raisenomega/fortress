import type { AppContext } from '@application/context'
import { asentarNotas } from '@application/system/asentar-notas'
import { notasDeBloque, sinBloqueDeNotas } from '@domain/system/extraer-notas'
import { investigatePrompt } from '@domain/build/build-prompt'
import { err, ok, type Result } from '@domain/shared/result'
import { agentFor, resolveTarget } from './build-target'
import { MODELO_POR_ROL } from '@domain/agent/modelo-por-rol'

/** Investigacion: el agente responde sobre el proyecto en SOLO LECTURA. */
export async function runInvestigate(
  context: AppContext,
  projectId: string,
  intent: string,
  /** El texto segun llega, para pintarlo en vivo (mismo cable que el Plan). */
  onChunk: (delta: string) => void = () => {}
): Promise<Result<string>> {
  const target = resolveTarget(context, projectId)
  if (!target.ok) return target
  const reply = await agentFor(context).run(
    {
      projectPath: target.value.path,
      projectId: target.value.id,
      prompt: investigatePrompt(target.value.name, intent),
      // 'lectura', no 'plan': plan bloquea TODO el MCP, asi que el grafo nunca
      // respondia. En 'lectura' (default) el grafo ejecuta y no se puede escribir.
      permissionMode: 'lectura',
      agentId: null,
      model: MODELO_POR_ROL.construir,
      trusted: target.value.trusted
    },
    onChunk
  )
  // Construir observa (sub-pieza 3 del #5): pase lo que pase con la respuesta.
  asentarNotas(context, target.value, notasDeBloque(reply.text))
  const texto = sinBloqueDeNotas(reply.text)
  return reply.failed ? err(texto) : ok(texto)
}
