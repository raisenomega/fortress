import type { Project } from '@domain/project/project'
import type { SeverityCounts } from '@domain/project/severity-counts'
import type { ScanOutcome } from '@domain/scan/scanner'
import type { AppContext } from '../context'
import { scanActivity } from '../telemetry/scan-activity'

/** El escaneo lo hace el Security Reviewer: es la FASE 1 del protocolo. */
const SCANNER_AGENT = 'security-reviewer' as const

export interface ScanCommit {
  readonly score: number
  /** Cuantos hallazgos puntuo ese score: la corrida MAS los que siguen vivos. */
  readonly dossierCount: number
  readonly counts: SeverityCounts
  readonly scannedAt: string
  /** Ids que conservan su marca de mitigado en vez de volver a ACTIVE. */
  readonly conservados: ReadonlySet<string>
}

/**
 * Escribe en UNA transaccion las filas del escaneo: historico, hallazgos,
 * score, telemetria y timeline. Van juntas porque describen el
 * mismo hecho; si entrara solo una parte, el tablero contaria una version
 * distinta de la que ocurrio.
 */
export function commitScanRows(
  context: AppContext,
  project: Project,
  outcome: ScanOutcome,
  commit: ScanCommit
): void {
  const { findings, durationMs, usage, tools, edits } = outcome
  const { score, counts, scannedAt, conservados } = commit

  context.transaction(() => {
    const scan = context.scans.record({
      projectId: project.id,
      score,
      findingCount: findings.length,
      dossierCount: commit.dossierCount,
      criticalCount: counts.CRITICAL,
      durationMs,
      at: scannedAt
    })
    context.findings.syncFromScan(project.id, scan.id, findings, scannedAt, conservados)
    context.projects.updateScan(project.id, score, scannedAt)
    context.runs.record({ projectId: project.id, agentId: SCANNER_AGENT, kind: 'scan', durationMs, failed: false, usage, tools }) // prettier-ignore
    context.activity.recordMany(scanActivity(project.id, SCANNER_AGENT, findings, counts, edits))
  })
}
