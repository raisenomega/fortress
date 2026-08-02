import type { AgentId } from '@domain/agent/agent'
import type { SeverityCounts } from '@domain/project/severity-counts'
import { presentSeverities, totalFindings } from '@domain/project/severity-counts'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { NewActivity } from '@domain/telemetry/activity'

function describeCounts(counts: SeverityCounts): string {
  const partes = presentSeverities(counts).map((severity) => `${counts[severity]} ${severity}`)
  return partes.length === 0 ? 'sin hallazgos' : partes.join(', ')
}

/**
 * Convierte un escaneo en entradas del timeline. Una por el escaneo, una por
 * hallazgo y una por archivo editado: el operador tiene que poder reconstruir
 * que paso sin volver a abrir el chat.
 */
export function scanActivity(
  projectId: string,
  agentId: AgentId | null,
  findings: readonly DetectedFinding[],
  counts: SeverityCounts,
  edits: readonly string[]
): readonly NewActivity[] {
  const cabecera: NewActivity = {
    projectId,
    agentId,
    kind: 'scan',
    summary: `Escaneo de seguridad: ${describeCounts(counts)}`,
    severity: null,
    file: '',
    line: null
  }

  const hallazgos = findings.map((finding): NewActivity => ({
    projectId,
    agentId,
    kind: 'finding',
    summary: finding.title,
    severity: finding.severity,
    file: finding.file,
    line: finding.line
  }))

  const ediciones = [...new Set(edits)].map((file): NewActivity => ({
    projectId,
    agentId,
    kind: 'edit',
    summary: 'Modifico el archivo',
    severity: null,
    file,
    line: null
  }))

  return totalFindings(counts) === 0 && edits.length === 0
    ? [cabecera]
    : [cabecera, ...hallazgos, ...ediciones]
}
