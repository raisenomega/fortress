import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
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

/** Lee un .md de la raiz. Path-guarded: solo nombres planos .md del proyecto. */
export function readProjectDoc(projectPath: string, name: string): Result<string> {
  if (!isSafeDocName(name)) return err('Documento no permitido')
  try {
    return ok(readFileSync(join(projectPath, name), 'utf8'))
  } catch {
    return err('No se pudo leer el documento')
  }
}
