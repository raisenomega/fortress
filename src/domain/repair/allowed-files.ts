/** Ruta de codigo con pinta de archivo real: sin espacios, con extension. */
const FILE_LIKE = /^[\w@./-]+\.\w+$/
const CODE = /\.(ts|tsx)$/

/**
 * D10 — un hallazgo, un fix: el generador solo puede tocar el archivo del
 * analisis y sus tests hermanos (mismo dir, mismo basename, .test/.spec de la
 * misma extension). Un `where` que no parece archivo devuelve [] y el caller
 * lo trata como scope vacio: mejor no generar que generar sin correa.
 */
export function computeAllowedFiles(where: string): string[] {
  const file = where.trim()
  if (!FILE_LIKE.test(file)) return []
  const match = CODE.exec(file)
  if (match === null) return [file]

  const ext = match[1]
  const base = file.slice(0, -(ext.length + 1))
  return [file, `${base}.test.${ext}`, `${base}.spec.${ext}`]
}
