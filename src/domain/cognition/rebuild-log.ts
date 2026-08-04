import type { SeverityCounts } from '../project/severity-counts'
import type { DetectedFinding } from '../scan/detected-finding'
import { buildAttention, buildPatterns } from './cognition-patterns'
import { buildReflectionEntry } from './reflection-entry'

const MARKER = '## REFLEXIONES POR SESION'

function header(projectName: string): string {
  return [`# COGNITION-LOG — ${projectName}`, '', '## GENERACION ACTUAL', '', 'Generacion: 0', ''].join(
    '\n'
  )
}

/** Las reflexiones ya escritas: se conservan (son historia, se acumulan). */
function pastReflections(existing: string): string {
  const idx = existing.indexOf(MARKER)
  return idx === -1 ? '' : existing.slice(idx + MARKER.length).trim()
}

/**
 * Reconstruye el COGNITION-LOG tras un escaneo: cabecera + mapa de atencion +
 * patrones REGENERADOS de los hallazgos actuales + las reflexiones (las viejas
 * se conservan, la nueva se anade). Los patrones no se acumulan; las reflexiones si.
 */
export function rebuildLog(
  existing: string,
  projectName: string,
  findings: readonly DetectedFinding[],
  score: number,
  counts: SeverityCounts,
  at: string
): string {
  const nueva = buildReflectionEntry(projectName, at, score, counts).trim()
  const reflexiones = [pastReflections(existing), nueva].filter(Boolean).join('\n\n')

  return [
    header(projectName),
    buildAttention(findings),
    buildPatterns(findings, at),
    MARKER,
    '',
    reflexiones,
    ''
  ].join('\n')
}
