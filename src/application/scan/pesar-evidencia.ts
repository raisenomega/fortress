import { findingIdentity } from '@domain/project/finding-identity'
import type { Project } from '@domain/project/project'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { AppContext } from '../context'
import { decideConservados } from './conservar-mitigado'
import { decideExtinctions, type ExtinctionOutcome } from './extinguish'

/**
 * Las dos preguntas a git de un escaneo, juntas y FUERA de la transaccion:
 * quien se extingue y quien conserva su marca de mitigado. Son hermanas y no
 * una modificacion de la otra — la extincion cierra hallazgos con evidencia; la
 * conservacion solo decide si una marca del operador sigue en pie.
 */
export async function pesarEvidencia(
  context: AppContext,
  project: Project,
  findings: readonly DetectedFinding[]
): Promise<ExtinctionOutcome & { conservados: ReadonlySet<string> }> {
  const memoria = context.findings.listMemory(project.id)
  const reportadas = new Set(findings.map(findingIdentity))
  return {
    ...(await decideExtinctions(context.fileHistory, project.path, memoria, findings)),
    conservados: await decideConservados(context.fileHistory, project.path, memoria, reportadas)
  }
}
