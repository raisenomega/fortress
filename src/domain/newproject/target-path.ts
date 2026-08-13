import { isValidFolderName, toFolderName } from './folder-name'
import { isAbsoluteProjectPath } from '../project/project-path'
import { err, ok, type Result } from '../shared/result'

/** Une sin depender de node: el dominio lo comparten main y renderer. */
export function joinPath(parent: string, child: string): string {
  return `${parent.replace(/\/+$/, '')}/${child}`
}

/**
 * La carpeta padre tampoco es fuente de confianza: llega del renderer por IPC.
 * Debe ser absoluta (POSIX, Windows o UNC) y no salirse de si misma con "..",
 * porque con ella se lista contenido antes incluso de crear nada.
 */
function isSafeParent(parentDir: unknown): parentDir is string {
  return isAbsoluteProjectPath(parentDir) && !parentDir.split(/[\\/]/).includes('..')
}

/**
 * Ruta final donde se creara el proyecto. Se validan ANTES de tocar disco los
 * dos insumos: un nombre con barras o con ".." escribiria fuera de la carpeta
 * que el operador eligio, y un padre arbitrario trasladaria esa carpeta entera
 * a donde nadie pidio, que es justo lo que no puede pasar.
 */
export function resolveTarget(parentDir: string, projectName: string): Result<string> {
  // El tipo lo promete, el IPC no: aqui el valor puede no ser ni texto.
  if (typeof parentDir !== 'string' || parentDir.trim() === '') {
    return err('Elige donde crear el proyecto')
  }
  if (!isSafeParent(parentDir)) {
    return err('La carpeta donde crear el proyecto debe ser una ruta absoluta, sin ".."')
  }

  const folder = toFolderName(projectName)
  if (!isValidFolderName(folder)) {
    return err('Ese nombre no sirve como carpeta. Usa letras, numeros y guiones')
  }

  return ok(joinPath(parentDir, folder))
}
