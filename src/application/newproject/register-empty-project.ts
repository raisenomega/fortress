import type { Project } from '@domain/project/project'
import { isAbsoluteProjectPath } from '@domain/project/project-path'
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
  // Se recorta UNA vez y esa cadena vale para las tres cosas: validar, iniciar
  // git y registrar. `addProject` persiste la recortada, asi que validar y hacer
  // `git init` sobre la cruda dejaba el arbol en `/a/b ` y la fila en `/a/b`:
  // dos rutas para un solo proyecto, y la ruta ES la identidad. Y el duplicado
  // tampoco se veia —`findByPath` comparaba la cruda contra filas recortadas—,
  // asi que el mismo proyecto podia entrar dos veces.
  //
  // Es el defecto que `fa71493` cerro DENTRO de `addProject`, vivo un piso mas
  // arriba: el arreglo siguio a la funcion y no a la responsabilidad.
  const path = input.path.trim()

  // Validar ANTES del git init: el path viene del renderer (no confiable) y un
  // `git init` sobre una ruta relativa/ajena no debe ocurrir. Tambien el duplicado,
  // para no dejar un `.git` huerfano que luego bloquee el reintento.
  if (!isAbsoluteProjectPath(path)) return err('La ruta del proyecto debe ser absoluta')
  if (context.projects.findByPath(path)) {
    return err(`Ese proyecto ya esta en FORTRESS: ${path}`)
  }

  const init = await gitInit(path)
  if (!init.ok) return err(init.error)

  return addProject(context, {
    name: input.name,
    path,
    stack: input.stack,
    gitRemote: null,
    gitBranch: null,
    hasClaude: false,
    configState: 'PENDIENTE_CONFIGURACION'
  })
}
