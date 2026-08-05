import { appendMessage } from '@application/chat/chat-history'
import { buildFeature } from '@application/build/build-feature'
import type { AppContext } from '@application/context'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import type { CodeAgent } from '@domain/chat/code-agent'
import { buildMcpConfig } from '@domain/connectors/mcp-config'
import { buildPlanPrompt } from '@domain/build/build-prompt'
import { err, ok, type Result } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { gitRevert, gitSnapshot } from '../loop/loop-git'
import { loopVerify } from '../loop/loop-verify'

function agentFor(context: AppContext): CodeAgent {
  const cfg = buildMcpConfig(context.connectors.list())
  return createClaudeCodeAgent(context.apiKeys, readBudget(context), usesApiKey(context), cfg)
}

/** Fase 1: el planner disena el plan (solo lectura). El humano lo aprueba luego. */
export async function runBuildPlan(
  context: AppContext,
  projectId: string,
  intent: string
): Promise<Result<string>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  const reply = await agentFor(context).run(
    {
      projectPath: project.path,
      prompt: buildPlanPrompt(project.name, intent),
      permissionMode: 'plan',
      agentId: 'planner',
      trusted: project.trusted
    },
    () => {}
  )
  return reply.failed ? err(reply.text) : ok(reply.text)
}

/** Fase 2: construye el plan aprobado con red git+verify y persiste el resultado. */
export async function runBuild(
  context: AppContext,
  projectId: string,
  intent: string,
  plan: string
): Promise<Result<void>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  const result = await buildFeature(
    context,
    projectId,
    intent,
    plan,
    agentFor(context),
    {
      snapshot: () => gitSnapshot(project.path),
      revert: (sha) => gitRevert(project.path, sha),
      verify: () => loopVerify(project.path)
    },
    () => {}
  )
  const text = result.ok
    ? `Construccion completada:\n\n${result.value.text}`
    : `Construccion no aplicada: ${result.error}`
  appendMessage(context, {
    projectId,
    role: 'assistant',
    content: text,
    agentId: null,
    mode: 'autonomo',
    engine: 'claude-code'
  })
  return result.ok ? ok(undefined) : err(result.error)
}
