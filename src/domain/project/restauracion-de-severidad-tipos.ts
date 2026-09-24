import type { Severity } from '../shared/severity'

/** Una fila viva de un proyecto, con lo que el lote necesita para decidir. */
export interface FilaDeFamilia {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly tipo: string
  readonly severity: Severity
  readonly lifecycle: string
  readonly title: string
}
/** Una nota «Severidad por ejes» del Libro: su fecha y su evidencia. */
export interface Nota {
  readonly at: string
  readonly evidence: string
}
export interface Entrada {
  readonly modelo: Severity
  readonly banda: Severity
  readonly ejes: string
}
export interface Restauracion {
  readonly id: string
  readonly file: string
  readonly line: number | null
  readonly tipo: string
  readonly title: string
  readonly de: Severity
  readonly a: Severity
}
export interface Excluida {
  readonly id: string
  readonly razon: 'extinta' | 'no es de auditoria' | 'ambigua'
}
