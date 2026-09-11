import type { AppContext } from '@application/context'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { AbSide, GraphAb } from '@domain/graph/graph-actions'
import { ok, type Result } from '@domain/shared/result'
import type { ClaudePermissionMode } from '@domain/settings/permission-mode'
import { totalTokens } from '@domain/telemetry/token-usage'
import { agentFor, resolveTarget } from '../build/build-target'

const NOOP = (): void => {}
const GRAFO_FIRST =
  'GRAFO PRIMERO: usa el MCP codebase-memory (get_architecture/search_graph/trace_path) ' +
  'antes de leer archivos. '

async function runSide(
  agent: CodeAgent,
  projectId: string,
  projectPath: string,
  prompt: string,
  permissionMode: ClaudePermissionMode,
  trusted: boolean
): Promise<AbSide> {
  // El `projectId` viaja aunque el A/B no lo necesite: es de quien es el
  // proceso —lo que hace que Detener lo alcance— y sin el su corrida no se
  // asienta, porque una fila sin proyecto seria huerfana.
  const reply = await agent.run(
    { projectPath, projectId, prompt, permissionMode, agentId: null, trusted },
    NOOP
  )
  return { tokens: totalTokens(reply.usage), costUsd: reply.usage.costUsd, answered: !reply.failed }
}

/**
 * La MISMA pregunta dos veces: 'lectura' (SOLO grafo, mapa barato) y 'plan'
 * (normal: grafo + Bash/Read, analisis profundo). Muestra el trade-off
 * costo/profundidad lado a lado, reproducible.
 */
export async function abGraph(
  context: AppContext,
  projectId: string,
  question: string
): Promise<Result<GraphAb>> {
  const target = resolveTarget(context, projectId)
  if (!target.ok) return target
  const { path, trusted } = target.value
  const agent = agentFor(context)
  const lectura = await runSide(
    agent,
    projectId,
    path,
    `${GRAFO_FIRST}${question}`,
    'lectura',
    trusted
  )
  const normal = await runSide(agent, projectId, path, question, 'plan', trusted)
  return ok({ question, lectura, normal })
}
