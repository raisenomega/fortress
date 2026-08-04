import type { ScanRecord } from '../scan/scan-record'
import { SEVERITIES } from '../shared/severity'
import type { Finding, Project } from './project'

/**
 * Registro que se deja EN la carpeta del proyecto al quitarlo de FORTRESS: score,
 * hallazgos abiertos e historial de escaneos. Los datos vivían en FORTRESS; esto
 * los conserva en el propio repo antes de soltarlo, sin dejar proyectos fantasma.
 */
export function buildProjectRecord(
  project: Project,
  findings: readonly Finding[],
  scans: readonly ScanRecord[],
  at: string
): string {
  const abiertos = findings.filter((finding) => finding.status === 'open')
  const lines = [
    `# FORTRESS-RECORD — ${project.name}`,
    '',
    `Generado al quitar el proyecto del tablero de FORTRESS: ${at.slice(0, 10)}.`,
    '',
    `- Score FORTRESS: ${project.fortressScore}/100`,
    `- Ultimo escaneo: ${project.lastScan ?? 'nunca'}`,
    `- Escaneos registrados: ${scans.length}`,
    `- Hallazgos abiertos: ${abiertos.length}`,
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

  return lines.join('\n') + '\n'
}
