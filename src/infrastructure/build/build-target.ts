import type { AppContext } from '@application/context'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import type { CodeAgent } from '@domain/chat/code-agent'
import type { Project } from '@domain/project/project'
import { buildMcpConfig } from '@domain/connectors/mcp-config'
import { err, ok, type Result } from '@domain/shared/result'
import { agenteQueAsientaCorrida } from '../claude-code/agente-que-asienta'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { isFortressRepo } from '../system/self-project'

/**
 * El agente del Ejecutor, el Plan, la Investigacion y el A/B del grafo. Sale
 * envuelto: ninguno de esos tiene orquestador que asiente su corrida, y sin el
 * decorador gastaban sin constar en `agent_runs`.
 */
export function agentFor(context: AppContext): CodeAgent {
  const cfg = buildMcpConfig(context.connectors.list())
  const base = createClaudeCodeAgent(context.apiKeys, readBudget(context), usesApiKey(context), cfg)
  return agenteQueAsientaCorrida(base, context, 'sistema')
}

/**
 * Resuelve el proyecto objetivo. Lo usan los modos de SOLO LECTURA (Plan e
 * Investigacion, que corren al agente en permissionMode 'plan' y NO editan): es
 * seguro conversar/investigar sobre CUALQUIER proyecto, incluido el propio repo.
 */
export function resolveTarget(context: AppContext, projectId: string): Result<Project> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  return ok(project)
}

/**
 * Resuelve y BLINDA el repo de FORTRESS: solo para EDITAR (Ejecutor). El peligro
 * —el agente pisando el codigo vivo de la app mientras corre— existe unicamente
 * al editar; conversar e investigar (solo lectura) SI se permiten.
 */
export function resolveEditTarget(context: AppContext, projectId: string): Result<Project> {
  const target = resolveTarget(context, projectId)
  if (!target.ok) return target
  if (isFortressRepo(target.value.path)) {
    return err('No se puede EDITAR el propio repo de FORTRESS (conversar/investigar si)')
  }
  return target
}
