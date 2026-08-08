import { isOpen } from '@domain/project/finding-status'
import type { Project } from '@domain/project/project'
import { countFindings, type SeverityCounts } from '@domain/project/severity-counts'
import { resolvedFindings } from '@domain/scan/resolved-findings'
import type { ScanOutcome } from '@domain/scan/scanner'
import { scoreFromFindings } from '@domain/scan/score-from-findings'
import { nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import { scanActivity } from '../telemetry/scan-activity'
import type { ScanSummary } from './scan-types'

/** El escaneo lo hace el Security Reviewer: es la FASE 1 del protocolo. */
const SCANNER_AGENT = 'security-reviewer' as const

/** Escribe en una transaccion las filas del escaneo (historico, hallazgos, run, timeline). */
function commitScanRows(
  context: AppContext,
  project: Project,
  outcome: ScanOutcome,
  score: number,
  counts: SeverityCounts,
  scannedAt: string
): void {
  const { findings, durationMs, usage, tools, edits } = outcome
  context.transaction(() => {
    const scan = context.scans.record({
      projectId: project.id,
      score,
      findingCount: findings.length,
      criticalCount: counts.CRITICAL,
      durationMs,
      at: scannedAt
    })
    context.findings.replaceForProject(project.id, scan.id, findings)
    context.projects.updateScan(project.id, score, scannedAt)
    context.runs.record({ projectId: project.id, agentId: SCANNER_AGENT, kind: 'scan', durationMs, failed: false, usage, tools }) // prettier-ignore
    context.activity.recordMany(scanActivity(project.id, SCANNER_AGENT, findings, counts, edits))
  })
}

/**
 * Guarda todo lo que produjo un escaneo de una sola vez. Historico, hallazgos,
 * score, telemetria y timeline describen el mismo hecho: si entrara solo una
 * parte, el tablero contaria una version distinta de la que ocurrio.
 */
export function persistScan(
  context: AppContext,
  project: Project,
  outcome: ScanOutcome
): ScanSummary {
  const { findings, durationMs } = outcome
  const score = scoreFromFindings(findings)
  const counts = countFindings(findings)
  const scannedAt = nowIso()
  // Antes de reemplazar: que hallazgos abiertos ya NO aparecen -> se resolvieron.
  const previous = context.findings.listByProject(project.id).filter((row) => isOpen(row.status))
  const resolved = resolvedFindings(previous, findings)

  commitScanRows(context, project, outcome, score, counts, scannedAt)

  // Cognition registra lo aprendido en la memoria del proyecto: patrones al dia
  // (los hallazgos dejan de reaparecer) y la reflexion de la sesion. Fuera de la
  // transaccion: es un archivo, y perderlo no debe invalidar el escaneo.
  context.cognitionWriter.writeScan({
    projectPath: project.path,
    projectName: project.name,
    findings,
    resolved,
    score,
    counts,
    at: scannedAt
  })

  return { projectId: project.id, score, scannedAt, durationMs, counts }
}
