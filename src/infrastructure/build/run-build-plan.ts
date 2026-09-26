import type { AppContext } from '@application/context'
import { buildPlanPrompt } from '@domain/build/build-prompt'
import { err, ok, type Result } from '@domain/shared/result'
import { agentFor, resolveTarget } from './build-target'
import { savePlanDoc } from './save-plan-doc'

/**
 * Fase 1: el planner disena el plan (solo lectura) y FORTRESS lo guarda en .md.
 * Corre en 'lectura', no en 'plan': `plan` bloquea todo el MCP y el planner no
 * veia el grafo (bug 2 repetido, ROADMAP #5 sub-pieza 2). 'lectura' ademas le
 * QUITA Bash, que `plan` regalaba sin constar en ninguna lista.
 */
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
      projectId: target.value.id,
      prompt: buildPlanPrompt(target.value.name, intent),
      permissionMode: 'lectura',
      agentId: 'planner',
      trusted: target.value.trusted
    },
    () => {}
  )
  if (reply.failed) return err(reply.text)
  const saved = savePlanDoc(
    target.value.path,
    target.value.name,
    intent,
    reply.text,
    new Date().toISOString()
  )
  return ok(saved ? `${reply.text}\n\n— Plan guardado en ${saved}` : reply.text)
}
