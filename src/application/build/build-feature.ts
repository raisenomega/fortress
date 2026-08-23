import type { CodeAgent } from '@domain/chat/code-agent'
import { buildFeaturePrompt } from '@domain/build/build-prompt'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

export interface BuildDeps {
  /** Checkpoint git; devuelve la referencia base, o null si no es un repo. */
  snapshot: () => string | null
  /** Revierte al checkpoint (la red si el build rompe el arbol). */
  revert: (ref: string) => void
  /** typecheck/lint/test del proyecto: true si todo queda verde. */
  verify: () => Promise<boolean>
}

export interface BuildResult {
  readonly text: string
  readonly edits: readonly string[]
}

/**
 * Construye una feature: crea el codigo del plan APROBADO, con red git y verify.
 * Solo sobre proyecto de CONFIANZA y con GIT (para poder revertir). Si el agente
 * falla o la verificacion queda en rojo, REVIERTE. El plan ya viene firmado por el
 * humano (el gate del plan vive en la orquestacion, no aqui).
 */
export async function buildFeature(
  context: AppContext,
  projectId: string,
  intent: string,
  plan: string,
  agent: CodeAgent,
  deps: BuildDeps,
  onChunk: (delta: string) => void
): Promise<Result<BuildResult>> {
  const project = context.projects.findById(projectId)
  if (!project) return err('El proyecto ya no existe')
  if (!project.trusted) return err('Ejecutor exige un proyecto de confianza')
  const ref = deps.snapshot()
  if (ref === null) return err('Ejecutor exige un repo git para poder revertir')

  const prompt = buildFeaturePrompt(project.name, intent, plan)
  const reply = await agent.run(
    {
      projectPath: project.path,
      projectId: project.id,
      prompt,
      permissionMode: 'acceptEdits',
      agentId: null,
      trusted: true
    },
    onChunk
  )
  if (reply.failed) {
    deps.revert(ref)
    return err(reply.text)
  }
  if (!(await deps.verify())) {
    deps.revert(ref)
    return err('La verificacion quedo en rojo: se revirtio el cambio')
  }
  return ok({ text: reply.text, edits: reply.edits })
}
