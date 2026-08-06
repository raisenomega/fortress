import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'

const MAX = 40
const MAX_LEN = 200

/**
 * El titulo y la ruta salen del REPO auditado (texto no confiable). Se aplanan a
 * una sola linea y se acotan para que un hallazgo con saltos de linea o marcadores
 * no pueda romper el formato del prompt e inyectar ordenes en la fase de edicion.
 */
function sanitize(text: string): string {
  const flat = text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
  return flat.length > MAX_LEN ? `${flat.slice(0, MAX_LEN)}…` : flat
}

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
    .map((finding) => {
      const loc = `${finding.file}${finding.line === null ? '' : `:${finding.line}`}`
      return sanitize(`${finding.severity} ${loc} — ${finding.title}`)
    })
}
