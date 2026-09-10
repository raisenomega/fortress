import { scanActivity } from '@application/telemetry/scan-activity'
import type { AppContext } from '@application/context'
import { findingIdentity } from '@domain/project/finding-identity'
import type { Project } from '@domain/project/project'
import { countFindings } from '@domain/project/severity-counts'
import { ausentes } from '@domain/scan/ausencia'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import { scoreFromFindings } from '@domain/scan/score-from-findings'
import type { ScanOutcome } from '@domain/scan/scanner'

/**
 * El camino de ANTES de ADR-082, copiado verbatim de `persistScan` +
 * `commitScanRows` tal y como estaban en main@5dcaf7d.
 *
 * Vive solo aqui, para las pruebas: es la referencia contra la que se compara
 * el camino partido. Sin el, "produce lo mismo que antes" seria una afirmacion
 * sin nada enfrente — habria que creerse una lista de numeros escritos a mano.
 * Con el, la comparacion es entre dos filas que existen de verdad.
 */
export async function caminoSoldado(
  context: AppContext,
  project: Project,
  outcome: ScanOutcome
): Promise<void> {
  const { findings, durationMs, usage, tools, edits } = outcome
  const scannedAt = '2026-09-09T22:00:00.000Z'

  const memoria = context.findings.listMemory(project.id)
  const reportadas = new Set(findings.map(findingIdentity))
  const expediente: readonly DetectedFinding[] = [
    ...findings,
    ...ausentes(memoria, reportadas).map(({ severity, title, file, line }) => ({ severity, title, file, line })) // prettier-ignore
  ]
  const score = scoreFromFindings(expediente)
  const counts = countFindings(expediente)

  context.transaction(() => {
    const scan = context.scans.record({
      projectId: project.id,
      score,
      findingCount: findings.length,
      dossierCount: expediente.length,
      criticalCount: counts.CRITICAL,
      durationMs,
      at: scannedAt
    })
    context.findings.syncFromScan(project.id, scan.id, findings, scannedAt, new Set())
    context.projects.updateScan(project.id, score, scannedAt)
    context.runs.record({ projectId: project.id, agentId: 'security-reviewer', kind: 'scan', durationMs, failed: false, usage, tools }) // prettier-ignore
    context.activity.recordMany(scanActivity(project.id, 'security-reviewer', findings, counts, edits)) // prettier-ignore
  })
}
