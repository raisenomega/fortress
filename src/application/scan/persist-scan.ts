import type { Project } from '@domain/project/project'
import { countFindings } from '@domain/project/severity-counts'
import type { ScanOutcome } from '@domain/scan/scanner'
import { scoreFromFindings } from '@domain/scan/score-from-findings'
import { nowIso } from '@domain/shared/id'
import type { AppContext } from '../context'
import { commitScanRows } from './commit-scan-rows'
import { asentarSeveridadDerivada } from './asentar-severidad'
import { asDetected } from './expediente-vivo'
import { pesarEvidencia } from './pesar-evidencia'
import type { ScanSummary } from './scan-types'

/**
 * Guarda todo lo que produjo un escaneo. NO cierra ningun hallazgo.
 *
 * Un escaneo solo puede afirmar lo que vio. Lo que no nombro sigue vivo y
 * puntuando, porque el escaner es un LLM leyendo codigo y su silencio no es un
 * veredicto. Quien cierra un hallazgo es un agente que lo mira, al drenar.
 */
export async function persistScan(
  context: AppContext,
  project: Project,
  outcome: ScanOutcome
): Promise<ScanSummary> {
  const { findings, durationMs } = outcome
  const scannedAt = nowIso()
  const { stillAlive, conservados } = await pesarEvidencia(context, project, findings)

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
    conservados
  })

  // Lo que la derivacion cambio respecto a la palabra del modelo (ADR-080):
  // un asiento por escaneo, fuera de la transaccion y a mejor esfuerzo.
  asentarSeveridadDerivada(context, project, findings)

  // Cognition registra lo aprendido en la memoria del proyecto. Fuera de la
  // transaccion: es un archivo, y perderlo no debe invalidar el escaneo.
  context.cognitionWriter.writeScan({
    projectPath: project.path,
    projectName: project.name,
    // El expediente entero: un ausente que nadie ha arreglado sigue listado. Si
    // solo se escribiera lo reportado, dejaria de mentir llamandolo extinto
    // para mentir callandolo.
    findings: expediente,
    // Un escaneo ya no resuelve nada por su cuenta: cerrar exige juicio.
    resolved: [],
    score,
    counts,
    at: scannedAt
  })

  return { projectId: project.id, score, scannedAt, durationMs, counts }
}
