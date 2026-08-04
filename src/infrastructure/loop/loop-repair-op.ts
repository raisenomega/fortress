import { knownFindings } from '@application/chat/known-findings'
import type { AppContext } from '@application/context'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { buildMcpConfig } from '@domain/connectors/mcp-config'
import { buildRepairPrompt } from '@domain/loop/repair-prompt'
import { err, ok, type Result } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'

/**
 * Fase de REPARACION: un agente EDITA para arreglar los hallazgos conocidos, en
 * acceptEdits (exige confianza, ya garantizada por el gate del toggle). El
 * checkpoint git + el verify del loop son la red por si deja el arbol roto.
 */
export async function loopRepair(
  context: AppContext,
  projectId: string,
  onChunk: (delta: string) => void,
  attempt = 0
): Promise<Result<void>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('Ese proyecto ya no existe')
  const busy = guardRun(context, projectId)
  if (busy !== null) return err(busy)

  const budget = readBudget(context)
  const codeAgent = createClaudeCodeAgent(
    context.apiKeys,
    budget,
    usesApiKey(context),
    buildMcpConfig(context.connectors.list())
  )
  const prompt = buildRepairPrompt(project.name, knownFindings(context, project), attempt)
  try {
    const reply = await codeAgent.run(
      { projectPath: project.path, prompt, permissionMode: 'acceptEdits', agentId: null, trusted: project.trusted },
      onChunk
    )
    return reply.failed ? err(reply.text) : ok(undefined)
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Fallo al reparar')
  } finally {
    endRun(projectId)
  }
}
