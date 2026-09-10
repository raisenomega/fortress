import { findingIdentity } from '@domain/project/finding-identity'
import type { Project } from '@domain/project/project'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { AppContext } from '../context'
import { decideConservados } from './conservar-mitigado'

/**
 * Guarda lo que UNA parada encontro. Nada mas: ni score, ni la fila del
 * escaneo, ni timeline, ni memoria del proyecto. Todo eso es del cierre, que
 * corre una sola vez cuando el recorrido entero termino (ADR-082).
 *
 * Se puede llamar N veces sobre el mismo escaneo y los hallazgos SE ACUMULAN.
 * No hay que construir nada para eso: `syncFromScan` es un upsert por
 * `identity` que no borra lo ausente, y esa propiedad se la dio ADR-065 al
 * decidir que el escaneo no extingue. Lo que no ha visto esta parada no es lo
 * mismo que lo que no existe, ni aqui ni alli.
 *
 * `conservados` se decide con lo reportado por ESTA parada, y es correcto: la
 * pregunta que responde —si una marca de mitigado del operador sigue en pie— se
 * hace hallazgo a hallazgo contra git, no sobre el conjunto. Lo que si necesita
 * el recorrido completo es `ausentes`, y por eso vive en el cierre.
 */
export async function asentarHallazgos(
  context: AppContext,
  project: Project,
  scanId: string,
  findings: readonly DetectedFinding[],
  at: string
): Promise<void> {
  const memoria = context.findings.listMemory(project.id)
  const reportadas = new Set(findings.map(findingIdentity))
  const conservados = await decideConservados(
    context.fileHistory,
    project.path,
    memoria,
    reportadas
  )

  context.findings.syncFromScan(project.id, scanId, findings, at, conservados)
}
