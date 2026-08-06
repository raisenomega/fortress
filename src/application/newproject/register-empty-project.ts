import type { Project } from '@domain/project/project'
import { err, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { addProject } from '../project/add-project'

export interface EmptyProjectInput {
  readonly name: string
  readonly path: string
  readonly stack: string
}

/**
 * Alta de un proyecto creado desde cero: inicia git y lo registra en estado
 * PENDIENTE_CONFIGURACION. El chat solo hara la entrevista de configuracion
 * hasta que su marco (constitucion + docs) quede aprobado y escrito. Reusa
 * addProject para la validacion de ruta absoluta y el rechazo de duplicados.
 */
export async function registerEmptyProject(
  context: AppContext,
  gitInit: (cwd: string) => Promise<Result<string>>,
  input: EmptyProjectInput
): Promise<Result<Project>> {
  const init = await gitInit(input.path)
  if (!init.ok) return err(init.error)

  return addProject(context, {
    name: input.name,
    path: input.path,
    stack: input.stack,
    gitRemote: null,
    gitBranch: null,
    hasClaude: false,
    configState: 'PENDIENTE_CONFIGURACION'
  })
}
