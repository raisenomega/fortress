import type { SeverityCounts } from '../project/severity-counts'
import type { DetectedFinding } from '../scan/detected-finding'

/** Todo lo que un escaneo aporta a la memoria del proyecto, de una sola vez. */
export interface CognitionScan {
  readonly projectPath: string
  readonly projectName: string
  readonly findings: readonly DetectedFinding[]
  readonly score: number
  readonly counts: SeverityCounts
  readonly at: string
}

/**
 * Puerto para escribir la memoria del proyecto. La aplicacion entrega los datos
 * del escaneo; la infraestructura reconstruye COGNITION-LOG.md (patrones al dia,
 * reflexiones acumuladas) y lo deja en disco.
 */
export interface CognitionWriter {
  writeScan(scan: CognitionScan): void
}
