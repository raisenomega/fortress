import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { dirname, join } from 'path'

/** Raiz temporal de los proyectos de prueba del descubridor. */
export const raiz = mkdtempSync(join(tmpdir(), 'fortress-corpus-'))

export const limpiar = (): void => rmSync(raiz, { recursive: true, force: true })

/** Un proyecto de prueba con exactamente los ficheros y carpetas que se le pidan. */
export function proyecto(
  nombre: string,
  docs: readonly string[],
  dirs: readonly string[] = []
): string {
  const dir = join(raiz, nombre)
  mkdirSync(dir, { recursive: true })
  for (const doc of docs) {
    mkdirSync(dirname(join(dir, doc)), { recursive: true })
    writeFileSync(join(dir, doc), '# contenido')
  }
  for (const carpeta of dirs) mkdirSync(join(dir, carpeta), { recursive: true })
  return dir
}
