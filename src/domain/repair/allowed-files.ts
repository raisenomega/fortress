import { extractPathHints } from './path-hints'

/** Ruta de codigo con pinta de archivo real: sin espacios, con extension. */
const FILE_LIKE = /^[\w@./-]+\.\w+$/
const CODE = /\.(ts|tsx)$/

export interface AllowedFilesInput {
  /** El path ESTRUCTURADO del hallazgo (finding.file / analysis.target.file):
   *  siempre un path real. Es el ANCLA de la correa. */
  readonly primaryFile: string
  /** La prosa del `where` de C2 (opcional): fuente SECUNDARIA de la que se
   *  extraen paths embebidos como extras — solo del MISMO directorio. */
  readonly hint?: string
}

/**
 * D10 — un hallazgo, un fix. La correa se ancla al file estructurado (I2.1:
 * el `where` del analista resulto ser prosa y dejo la correa vacia en la
 * primera corrida real). Extras del hint: mismo dir que el ancla, para que la
 * prosa no arrastre paths de todo el repo. Los tests hermanos se computan
 * SIEMPRE sobre el ancla, nunca sobre extras. La existencia en disco no se
 * comprueba (dominio puro): un extra inexistente solo ensancha la correa.
 */
export function computeAllowedFiles(input: AllowedFilesInput): string[] {
  const primary = input.primaryFile.trim()
  if (!FILE_LIKE.test(primary)) return []

  const files: string[] = [primary]
  const code = CODE.exec(primary)
  if (code !== null) {
    const ext = code[1]
    const base = primary.slice(0, -(ext.length + 1))
    files.push(`${base}.test.${ext}`, `${base}.spec.${ext}`)
  }

  if (input.hint !== undefined) {
    const dir = primary.slice(0, primary.lastIndexOf('/') + 1)
    const extras = extractPathHints(input.hint)
      .filter((token) => !files.includes(token))
      .filter((token) => token.startsWith(dir) && !token.slice(dir.length).includes('/'))
      .sort()
    files.push(...extras)
  }
  return files
}
