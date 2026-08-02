import type { Severity } from '../shared/severity'

/**
 * Hallazgo tal y como lo reporta un escaneo, antes de guardarse. No tiene id
 * porque lo asigna la persistencia: el escaner describe el problema, no la fila.
 */
export interface DetectedFinding {
  readonly severity: Severity
  readonly title: string
  /** Ruta relativa a la raiz del proyecto. Vacia si el hallazgo es global. */
  readonly file: string
  readonly line: number | null
}
