import { appendFileSync, existsSync, writeFileSync } from 'fs'
import { join } from 'path'
import { cognitionBaseline } from '@domain/cognition/reflection-entry'

const FILE = 'COGNITION-LOG.md'

/**
 * Añade una reflexion al COGNITION-LOG.md del proyecto. Si el archivo no existe,
 * lo crea con la cabecera minima. Es lo que hace que el panel deje de leer un
 * archivo que nadie rellenaba: FORTRESS registra lo que el escaneo encontro.
 *
 * Mejor esfuerzo: si el disco falla, no se hunde el escaneo, que ya se guardo.
 */
export function appendReflection(projectPath: string, projectName: string, entry: string): void {
  try {
    const path = join(projectPath, FILE)
    if (!existsSync(path)) writeFileSync(path, cognitionBaseline(projectName))
    appendFileSync(path, entry)
  } catch {
    // El escaneo ya esta persistido; perder una reflexion no lo invalida.
  }
}
