import type { SeverityCounts } from '@domain/project/severity-counts'

/** Lo que la UI necesita saber al terminar un escaneo, sin releer la base. */
export interface ScanSummary {
  readonly projectId: string
  readonly score: number
  readonly scannedAt: string
  readonly durationMs: number
  readonly counts: SeverityCounts
}
