import type { FileProbe } from './finding-check'

/** Trozo de codigo real alrededor de una linea, para mostrar la evidencia. */
export interface FileSnippet {
  readonly found: boolean
  readonly lines: ReadonlyArray<{ readonly n: number; readonly text: string }>
}

/**
 * Puerto: lo implementa la infraestructura leyendo el disco (solo lectura).
 * El dominio no sabe de `fs`; solo pregunta "existe este archivo del proyecto?".
 */
export interface FilesystemProbe {
  probe(projectPath: string, relativeFile: string): FileProbe
  /** Lineas reales alrededor de `line` (1-indexado). La evidencia que OMEGA cita. */
  snippet(projectPath: string, relativeFile: string, line: number): FileSnippet
  /**
   * El texto entero del archivo, o `null` si no se pudo leer. Lo pide la red de
   * la extincion, que busca en el un marcador literal.
   *
   * El `null` NO significa "el archivo no esta": tambien lo devuelve una ruta que
   * se sale del proyecto o algo que no es un fichero regular, y quien pregunta no
   * puede distinguirlos. Por eso quien decida sobre un `null` tiene que elegir el
   * lado conservador; aqui, no extinguir.
   */
  contenido(projectPath: string, relativeFile: string): string | null
}
