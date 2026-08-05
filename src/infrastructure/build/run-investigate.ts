import type { AppContext } from '@application/context'
import { investigatePrompt } from '@domain/build/build-prompt'
import { err, ok, type Result } from '@domain/shared/result'
import { agentFor, resolveTarget } from './build-target'

/** Investigacion: el agente responde sobre el proyecto en SOLO LECTURA. */
export async function runInvestigate(
  context: AppContext,
  projectId: string,
  intent: string
): Promise<Result<string>> {
  const target = resolveTarget(context, projectId)
  if (!target.ok) return target
  const reply = await agentFor(context).run(
    {
      projectPath: target.value.path,
      prompt: investigatePrompt(target.value.name, intent),
      permissionMode: 'plan',
      agentId: null,
      trusted: target.value.trusted
    },
    () => {}
  )
  return reply.failed ? err(reply.text) : ok(reply.text)
}
