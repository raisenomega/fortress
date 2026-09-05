import { isAbsoluteProjectPath } from '@domain/project/project-path'
import type { NewProject, Project } from '@domain/project/project'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'

function validate(input: NewProject): string | null {
  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    return 'El nombre del proyecto no puede estar vacio'
  }
  if (typeof input.path !== 'string' || input.path.trim().length === 0) {
    return 'La ruta del proyecto no puede estar vacia'
  }
  if (!isAbsoluteProjectPath(input.path.trim())) return 'La ruta del proyecto debe ser absoluta'
  return null
}

/**
 * Agrega un proyecto rechazando rutas duplicadas: la ruta es la identidad real.
 *
 * Se valida y se persiste LA MISMA cadena. Antes se validaba `input.path.trim()`
 * y se guardaba `input.path`, asi que lo comprobado y lo guardado eran dos
 * valores distintos: `"/a/b "` pasaba el control de ruta absoluta —por el
 * recorte— y entraba con el espacio. Y como la ruta ES la identidad, `"/a/b"` y
 * `"/a/b "` eran dos proyectos para la base y uno solo en el disco.
 */
export function addProject(context: AppContext, input: NewProject): Result<Project> {
  const invalid = validate(input)
  if (invalid) return err(invalid)

  const saneado = { ...input, name: input.name.trim(), path: input.path.trim() }
  if (context.projects.findByPath(saneado.path)) {
    return err(`Ese proyecto ya esta en FORTRESS: ${saneado.path}`)
  }

  return ok(context.projects.add(saneado))
}
