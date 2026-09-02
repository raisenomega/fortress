import { isTerminal, type Proposal } from '../repair/proposal'
import type { ScanRecord } from '../scan/scan-record'
import { SEVERITIES } from '../shared/severity'
import type { Finding, Project } from './project'

/**
 * Registro que se deja EN la carpeta del proyecto al quitarlo de FORTRESS: score,
 * hallazgos abiertos, historial de escaneos y las propuestas de reparacion que
 * seguian vivas. Los datos vivían en FORTRESS; esto los conserva en el propio
 * repo antes de soltarlo, sin dejar proyectos fantasma.
 *
 * Es la foto del INSTANTE ANTERIOR a quitarlo, y por eso las propuestas salen
 * aqui como estaban —vivas— aunque un momento despues caduquen con juicio: el
 * record cuenta que habia, `omega_log` cuenta que se hizo. Dos verdades con
 * marcas de tiempo distintas; ninguna sobra.
 */
export function buildProjectRecord(
  project: Project,
  findings: readonly Finding[],
  scans: readonly ScanRecord[],
  proposals: readonly Proposal[],
  at: string
): string {
  const abiertos = findings.filter((finding) => finding.status === 'open')
  const vivas = proposals.filter((propuesta) => !isTerminal(propuesta.state))
  const lines = [
    `# FORTRESS-RECORD — ${project.name}`,
    '',
    `Generado al quitar el proyecto del tablero de FORTRESS: ${at.slice(0, 10)}.`,
    '',
    `- Score FORTRESS: ${project.fortressScore}/100`,
    `- Ultimo escaneo: ${project.lastScan ?? 'nunca'}`,
    `- Escaneos registrados: ${scans.length}`,
    `- Hallazgos abiertos: ${abiertos.length}`,
    `- Propuestas de reparacion: ${proposals.length} (${vivas.length} vivas al retirarlo)`,
    '',
    '## Hallazgos abiertos'
  ]

  for (const severity of SEVERITIES) {
    const group = abiertos.filter((finding) => finding.severity === severity)
    if (group.length === 0) continue
    lines.push(`### ${severity}`)
    for (const f of group) lines.push(`- ${f.file}${f.line ? `:${f.line}` : ''} — ${f.title}`)
  }
  if (abiertos.length === 0) lines.push('Ninguno: el proyecto quedo limpio.')

  if (vivas.length > 0) {
    lines.push('', '## Propuestas vivas al retirarlo')
    for (const p of vivas) {
      lines.push(`- ${p.id.slice(0, 8)} — ${p.state}, sobre el hallazgo ${p.findingId.slice(0, 8)}`)
    }
  }

  return lines.join('\n') + '\n'
}
