import { readdirSync, readFileSync, realpathSync, statSync } from 'fs'
import { isAbsolute, join, relative } from 'path'
import { err, ok, type Result } from '@domain/shared/result'

const MD = /\.md$/i

/** Nombre plano de .md de la raiz del proyecto: sin subrutas ni traversal. */
function isSafeDocName(name: string): boolean {
  return MD.test(name) && !name.includes('/') && !name.includes('\\') && !name.includes('..')
}

/** Los .md de la raiz del proyecto (incluidos los internos gitignorados). */
export function listProjectDocs(projectPath: string): readonly string[] {
  try {
    return readdirSync(projectPath, { withFileTypes: true })
      .filter((entry) => entry.isFile() && MD.test(entry.name))
      .map((entry) => entry.name)
      .sort()
  } catch {
    return []
  }
}

/**
 * Ruta REAL del doc, o null si no es un archivo regular DENTRO del proyecto.
 * El nombre plano no basta: un POLICY.md de la raiz puede ser un enlace a un
 * fichero de credenciales del operador y colarse por el filtro lexico. Se
 * resuelven las DOS puntas, porque la raiz del proyecto puede ser a su vez un
 * enlace y comparar contra la nominal daria fuga falsa. Lanza si no existe.
 */
function realDocPath(projectPath: string, name: string): string | null {
  const real = realpathSync(join(projectPath, name))
  if (!statSync(real).isFile()) return null
  const rel = relative(realpathSync(projectPath), real)
  return rel.startsWith('..') || isAbsolute(rel) ? null : real
}

/** Lee un .md de la raiz. Path-guarded: solo nombres planos .md del proyecto. */
export function readProjectDoc(projectPath: string, name: string): Result<string> {
  if (!isSafeDocName(name)) return err('Documento no permitido')
  try {
    const real = realDocPath(projectPath, name)
    if (real === null) return err('Documento no permitido')
    return ok(readFileSync(real, 'utf8'))
  } catch {
    return err('No se pudo leer el documento')
  }
}
