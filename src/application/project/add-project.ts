import type { NewProject, Project } from '@domain/project/project'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

function validate(input: NewProject): string | null {
  if (input.name.trim().length === 0) return 'El nombre del proyecto no puede estar vacio'
  if (input.path.trim().length === 0) return 'La ruta del proyecto no puede estar vacia'
  return null
}

/** Agrega un proyecto rechazando rutas duplicadas: la ruta es la identidad real. */
export function addProject(context: AppContext, input: NewProject): Result<Project> {
  const invalid = validate(input)
  if (invalid) return err(invalid)

  if (context.projects.findByPath(input.path)) {
    return err(`Ese proyecto ya esta en FORTRESS: ${input.path}`)
  }

  return ok(context.projects.add(input))
}
