import type { AppContext } from '@application/context'
import { buildPlanPrompt } from '@domain/build/build-prompt'
import { err, ok, type Result } from '@domain/shared/result'
import { agentFor, resolveTarget } from './build-target'

/** Fase 1: el planner disena el plan (solo lectura). El humano lo aprueba luego. */
export async function runBuildPlan(
  context: AppContext,
  projectId: string,
  intent: string
): Promise<Result<string>> {
  const target = resolveTarget(context, projectId)
  if (!target.ok) return target
  const reply = await agentFor(context).run(
    {
      projectPath: target.value.path,
      prompt: buildPlanPrompt(target.value.name, intent),
      permissionMode: 'plan',
      agentId: 'planner',
      trusted: target.value.trusted
    },
    () => {}
  )
  return reply.failed ? err(reply.text) : ok(reply.text)
}
