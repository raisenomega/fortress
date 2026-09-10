import type { SeverityCounts } from '@domain/project/severity-counts'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { MotivoCierre } from '@domain/scan/motivo-cierre'
import type { TokenUsage } from '@domain/telemetry/token-usage'

/**
 * Lo que hace falta para cerrar un escaneo. `reportados` es la suma de TODAS
 * las paradas, no la ultima: el score puntua el expediente entero y `ausentes`
 * necesita saber que se nombro en el recorrido completo.
 */
export interface DatosDelCierre {
  readonly scanId: string
  readonly reportados: readonly DetectedFinding[]
  readonly paradasHechas: number
  /** Null mientras no haya manifiesto que declarar. */
  readonly ficherosCubiertos: number | null
  readonly motivo: MotivoCierre
  readonly at: string
  readonly durationMs: number
  readonly usage: TokenUsage
  readonly tools: readonly string[]
  readonly edits: readonly string[]
}

/** Lo que el cierre CALCULA sobre el expediente, una vez y al final. */
export interface Calculado {
  readonly score: number
  readonly counts: SeverityCounts
  /** El expediente entero: lo reportado MAS lo que sigue vivo sin nombrarse. */
  readonly expediente: readonly DetectedFinding[]
}
