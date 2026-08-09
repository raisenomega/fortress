import { knownFindings } from '@application/chat/known-findings'
import type { AppContext } from '@application/context'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { buildMcpConfig } from '@domain/connectors/mcp-config'
import { loopBlocked } from '@domain/loop/loop-gate'
import { buildRepairPrompt } from '@domain/loop/repair-prompt'
import { err, type Result } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { isFortressRepo } from '../system/self-project'
import { finishRepair } from './persist-repair'

/**
 * Fase de REPARACION: un agente EDITA para arreglar los hallazgos conocidos, en
 * acceptEdits. El checkpoint git + el verify del loop son la red por si deja
 * el arbol roto.
 *
 * La fase que EDITA re-verifica el gate por si misma: confianza y repo ajeno
 * no son negociables aunque el engine ya los comprobara. `configured` va en
 * true porque los topes los gobierna el engine; aqui lo que se defiende es el
 * arbol que se va a editar.
 */
export async function loopRepair(
  context: AppContext,
  projectId: string,
  onChunk: (delta: string) => void,
  attempt = 0
): Promise<Result<void>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('Ese proyecto ya no existe')
  const gate = { trusted: project.trusted, selfRepo: isFortressRepo(project.path), configured: true } // prettier-ignore
  const blocked = loopBlocked(gate)
  if (blocked !== null) return err(blocked)
  const busy = guardRun(context, projectId)
  if (busy !== null) return err(busy)

  const budget = readBudget(context)
  const codeAgent = createClaudeCodeAgent(
    context.apiKeys,
    budget,
    usesApiKey(context),
    buildMcpConfig(context.connectors.list())
  )
  const known = knownFindings(context, project)
  // Muestra los hallazgos en el chat antes de que los agentes empiecen a editar.
  onChunk(
    `Hallazgos a arreglar:\n${known.length ? known.map((k) => `- ${k}`).join('\n') : '(ninguno)'}\n\n`
  )
  const prompt = buildRepairPrompt(project.name, known, attempt)
  try {
    const reply = await codeAgent.run(
      {
        projectPath: project.path,
        prompt,
        permissionMode: 'acceptEdits',
        agentId: null,
        trusted: project.trusted
      },
      onChunk
    )
    if (reply.failed) return err(reply.text)
    return finishRepair(context, project, known, reply.text)
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Fallo al reparar')
  } finally {
    endRun(projectId)
  }
}
