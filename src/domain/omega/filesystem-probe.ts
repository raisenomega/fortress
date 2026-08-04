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
}
