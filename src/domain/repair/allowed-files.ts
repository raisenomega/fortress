import { extractPathHints } from './path-hints'

/** Ruta de codigo con pinta de archivo real: sin espacios, con extension. */
const FILE_LIKE = /^[\w@./-]+\.\w+$/
const CODE = /\.(ts|tsx)$/

/**
 * Fuera del arbol del proyecto: la misma verdad que el veto de `scope-check`,
 * en la otra punta de la cadena. Alli juzga el diff; aqui decide si hay correa,
 * porque el ancla la redacta un agente leyendo el repo auditado (P16) y el
 * bloque (permitidos) del prompt la vuelca literal — un `..` que entre aqui es
 * permiso por escrito para escribir donde el `git status` del worktree, que
 * solo ve su propio arbol, nunca podra mirar. Todas las formas, no el literal
 * (P1): segmento `..` en cualquier posicion, raiz POSIX, unidad Windows, UNC y
 * separador invertido.
 */
const fuera = (file: string): boolean =>
  file.startsWith('/') ||
  file.startsWith('\\') ||
  /^[a-zA-Z]:/.test(file) ||
  file.split(/[/\\]/).includes('..')

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
  // El guard va ANTES que todo: los hermanos se derivan del ancla y su dirname
  // filtra los extras, asi que rechazarla aqui limpia las tres salidas de una
  // vez. Sin ancla no hay correa (mismo contrato que un ancla sin pinta de path).
  if (fuera(primary) || !FILE_LIKE.test(primary)) return []

  const files: string[] = [primary]
  const code = CODE.exec(primary)
  if (code !== null) {
    const ext = code[1]
    const base = primary.slice(0, -(ext.length + 1))
    files.push(`${base}.test.${ext}`, `${base}.spec.${ext}`)
  }

  // La cordura de directorio es lo UNICO que hace segura la prosa: un extra
  // entra porque esta AL LADO del ancla. Con el ancla en la raiz ese `dir` queda
  // vacio y la regla deja de restringir — pasa a significar "cualquier fichero
  // de la raiz", que es donde vive la configuracion. Medido: un ancla
  // `index.ts` metia en la correa `.mcp.json` y `package.json` si la prosa los
  // nombraba, y la correa se vuelca literal en el bloque (permitidos) del prompt.
  //
  // Con ancla en la raiz el hint no anade nada. No hay lista de prohibidos y no
  // debe haberla: enumerar los sensibles dejaria fuera al que nadie recordo. Se
  // restaura la condicion, no sus excepciones. El ancla y sus hermanos siguen
  // entrando; tocar OTRO fichero pide su propia propuesta ("un hallazgo, un fix").
  const dir = primary.slice(0, primary.lastIndexOf('/') + 1)
  if (input.hint !== undefined && dir !== '') {
    const extras = extractPathHints(input.hint)
      .filter((token) => !files.includes(token))
      .filter((token) => token.startsWith(dir) && !token.slice(dir.length).includes('/'))
      .sort()
    files.push(...extras)
  }
  return files
}
