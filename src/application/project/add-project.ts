import type { NewProject, Project } from '@domain/project/project'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

/** Absoluta en POSIX (`/...`) o Windows (`C:\` o UNC `\\`). El renderer no es
 *  fuente de confianza: una ruta relativa o con `..` no debe entrar como raiz. */
function isAbsolutePath(p: string): boolean {
  return p.startsWith('/') || /^[a-zA-Z]:[\\/]/.test(p) || p.startsWith('\\\\')
}

function validate(input: NewProject): string | null {
  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    return 'El nombre del proyecto no puede estar vacio'
  }
  if (typeof input.path !== 'string' || input.path.trim().length === 0) {
    return 'La ruta del proyecto no puede estar vacia'
  }
  if (!isAbsolutePath(input.path.trim())) return 'La ruta del proyecto debe ser absoluta'
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
