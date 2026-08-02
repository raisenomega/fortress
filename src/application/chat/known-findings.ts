import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'

const MAX = 40

/**
 * Lo que FORTRESS ya midio, en texto, para metérselo al agente en el prompt.
 *
 * Existe por un fallo visto en uso real: al preguntarle "que viste en el
 * ultimo escaneo", el agente no tenia los hallazgos y se puso a buscar la base
 * SQLite por el disco. Claude Code se lo bloqueo (esta acotado al proyecto) y
 * gasto un turno entero razonando donde vivian los datos. Cada invocacion es
 * una sesion nueva: si no se le da el contexto, no lo tiene.
 */
export function knownFindings(context: AppContext, project: Project): readonly string[] {
  if (project.lastScan === null) return []

  return context.findings
    .listByProject(project.id)
    .filter((finding) => finding.status === 'open')
    .slice(0, MAX)
    .map(
      (finding) =>
        `${finding.severity} ${finding.file}${finding.line === null ? '' : `:${finding.line}`} — ${finding.title}`
    )
}
