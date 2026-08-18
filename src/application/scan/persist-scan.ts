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
  const scannedAt = nowIso()

  const { extinct, stillAlive } = await decideExtinctions(
    context.fileHistory,
    project.path,
    context.findings.listMemory(project.id),
    findings
  )

  // El score puntua el EXPEDIENTE, no la corrida: lo reportado hoy MAS los
  // ACTIVE que este escaneo no nombro y nadie arreglo. Puntuar solo la corrida
  // mentia por omision — 92 en el tablero con un HIGH vivo en la base (78 real).
  // Es la misma regla que ya sigue el log de COGNITION, para que numero y
  // registro cuenten la misma historia.
  const expediente = [...findings, ...asDetected(stillAlive)]
  const score = scoreFromFindings(expediente)
  const counts = countFindings(expediente)

  commitScanRows(context, project, outcome, {
    score,
    dossierCount: expediente.length,
    counts,
    scannedAt,
    extinct: extinct.map((f) => f.id)
  })

  // Cognition registra lo aprendido en la memoria del proyecto. Fuera de la
  // transaccion: es un archivo, y perderlo no debe invalidar el escaneo.
  context.cognitionWriter.writeScan({
    projectPath: project.path,
    projectName: project.name,
    // El expediente entero: un ausente que nadie ha arreglado sigue listado. Si
    // solo se escribiera lo reportado, dejaria de mentir llamandolo extinto
    // para mentir callandolo.
    findings: expediente,
    // Extintos: SOLO los que pasaron las dos pruebas.
    resolved: asDetected(extinct),
    score,
    counts,
    at: scannedAt
  })

  return { projectId: project.id, score, scannedAt, durationMs, counts }
}
