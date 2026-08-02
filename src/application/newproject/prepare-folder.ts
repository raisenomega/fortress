import type { NewProjectDraft } from '@domain/newproject/new-project-draft'
import { resolveTarget } from '@domain/newproject/target-path'
import { err, ok, type Result } from '@domain/shared/result'

export interface FolderPlan {
  readonly target: string
  /** Lo que ya hay dentro, o null si esta vacia o no existe. */
  readonly existing: string | null
}

export interface FolderTools {
  describeExisting(target: string): string | null
  create(parentDir: string, target: string, useExisting: boolean): Result<string>
}

/** Que ruta saldria, sin crear nada todavia. Para poder ensenarla antes. */
export function planFolder(tools: FolderTools, draft: NewProjectDraft): Result<FolderPlan> {
  const target = resolveTarget(draft.parentDir, draft.name)
  if (!target.ok) return err(target.error)

  return ok({ target: target.value, existing: tools.describeExisting(target.value) })
}

/**
 * Crea la carpeta. Se separa de planFolder a proposito: ensenar la ruta y
 * crearla son dos momentos distintos, y el operador tiene que ver la primera
 * antes de que ocurra la segunda.
 */
export function createFolder(
  tools: FolderTools,
  draft: NewProjectDraft,
  useExisting: boolean
): Result<string> {
  const plan = planFolder(tools, draft)
  if (!plan.ok) return err(plan.error)

  return tools.create(draft.parentDir, plan.value.target, useExisting)
}
