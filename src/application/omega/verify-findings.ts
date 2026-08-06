import { checkFinding, type FindingCheck } from '@domain/omega/finding-check'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'

/**
 * Verifica cada hallazgo ABIERTO del proyecto contra el filesystem. Compartido
 * por auditar (que lo registra) y puntuar (que lo cuenta), para que el numero
 * de discrepancias sea el mismo por ambos caminos.
 */
export function verifyFindings(context: AppContext, project: Project): readonly FindingCheck[] {
  return context.findings
    .listByProject(project.id)
    .filter((finding) => finding.status === 'open')
    .map((finding) =>
      checkFinding(finding, context.filesystemProbe.probe(project.path, finding.file))
    )
}
