import type { Project } from '@domain/project/project'
import { countFindings } from '@domain/project/severity-counts'
import type { ScanOutcome } from '@domain/scan/scanner'
import { scoreFromFindings } from '@domain/scan/score-from-findings'
import { nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import { commitScanRows } from './commit-scan-rows'
import { asDetected, decideExtinctions } from './extinguish'
import type { ScanSummary } from './scan-types'

/**
 * Guarda todo lo que produjo un escaneo y decide, con evidencia, que hallazgos
 * se extinguen.
 *
 * La regla: un hallazgo se extingue solo si el escaneo NO lo reporta Y su
 * archivo cambio desde que se detecto. Antes bastaba la ausencia, y por eso el
 * registro daba por resueltos problemas que nadie habia tocado.
 */
export async function persistScan(
  context: AppContext,
  project: Project,
  outcome: ScanOutcome
): Promise<ScanSummary> {
  const { findings, durationMs } = outcome
  const score = scoreFromFindings(findings)
  const counts = countFindings(findings)
  const scannedAt = nowIso()

  const { extinct, stillAlive } = await decideExtinctions(
    context.fileHistory,
    project.path,
    context.findings.listMemory(project.id),
    findings
  )

  commitScanRows(context, project, outcome, {
    score,
    counts,
    scannedAt,
    extinct: extinct.map((f) => f.id)
  })

  // Cognition registra lo aprendido en la memoria del proyecto. Fuera de la
  // transaccion: es un archivo, y perderlo no debe invalidar el escaneo.
  context.cognitionWriter.writeScan({
    projectPath: project.path,
    projectName: project.name,
    // Los ACTIVE del log son los del expediente, no solo los de esta corrida:
    // un ausente que nadie ha arreglado sigue listado. Si solo se escribiera lo
    // reportado, dejaria de mentir llamandolo extinto para mentir callandolo.
    findings: [...findings, ...asDetected(stillAlive)],
    // Extintos: SOLO los que pasaron las dos pruebas.
    resolved: asDetected(extinct),
    score,
    counts,
    at: scannedAt
  })

  return { projectId: project.id, score, scannedAt, durationMs, counts }
}
