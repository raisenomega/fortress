import { existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { err, ok, type Result } from '@domain/shared/result'

function isEmptyDir(path: string): boolean {
  return readdirSync(path).length === 0
}

/**
 * Crea la carpeta del proyecto. Es la primera vez que FORTRESS escribe fuera
 * de su propia base, asi que las reglas son estrictas:
 *
 * - La carpeta padre tiene que existir ya. No se crea media ruta por el camino.
 * - Si el destino existe y tiene contenido, se para. Escribir encima del
 *   trabajo de alguien es el error que no se puede deshacer.
 * - Reutilizar una carpeta con contenido exige que el operador lo pida.
 */
export function createProjectFolder(
  parentDir: string,
  target: string,
  useExisting: boolean
): Result<string> {
  if (!existsSync(parentDir) || !statSync(parentDir).isDirectory()) {
    return err(`La carpeta donde quieres crearlo no existe: ${parentDir}`)
  }

  if (!existsSync(target)) {
    mkdirSync(target)
    return ok(target)
  }

  if (!statSync(target).isDirectory()) return err(`Ya hay un archivo con esa ruta: ${target}`)
  if (isEmptyDir(target) || useExisting) return ok(target)

  return err(
    `La carpeta ${target} ya existe y tiene contenido. Marca la casilla si quieres usarla igualmente.`
  )
}

/** Que hay dentro, para poder avisar con datos y no en abstracto. */
export function describeExisting(target: string): string | null {
  if (!existsSync(target) || !statSync(target).isDirectory()) return null

  const entries = readdirSync(target)
  if (entries.length === 0) return null

  return `${entries.length} elementos, entre ellos ${entries.slice(0, 3).join(', ')}`
}
