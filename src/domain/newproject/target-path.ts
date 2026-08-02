import { isValidFolderName, toFolderName } from './folder-name'
import { err, ok, type Result } from '../shared/result'

/** Une sin depender de node: el dominio lo comparten main y renderer. */
export function joinPath(parent: string, child: string): string {
  return `${parent.replace(/\/+$/, '')}/${child}`
}

/**
 * Ruta final donde se creara el proyecto. Se valida el nombre ANTES de tocar
 * disco: un nombre con barras o con ".." escribiria fuera de la carpeta que
 * el operador eligio, que es justo lo que no puede pasar.
 */
export function resolveTarget(parentDir: string, projectName: string): Result<string> {
  if (parentDir.trim() === '') return err('Elige donde crear el proyecto')

  const folder = toFolderName(projectName)
  if (!isValidFolderName(folder)) {
    return err('Ese nombre no sirve como carpeta. Usa letras, numeros y guiones')
  }

  return ok(joinPath(parentDir, folder))
}
