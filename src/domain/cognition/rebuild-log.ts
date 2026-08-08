import type { SeverityCounts } from '../project/severity-counts'
import type { DetectedFinding } from '../scan/detected-finding'
import { buildAttention } from './attention-map'
import { buildExtinct, buildPatterns } from './cognition-patterns'
import { migrateExtinct } from './migrate-extinct'
import { readFirstSeen } from './pattern-history'
import { buildReflectionEntry } from './reflection-entry'

const MARKER = '## REFLEXIONES POR SESION'
const EXTINCT = '## PATRONES EXTINTOS'

function header(projectName: string): string {
  return [`# COGNITION-LOG — ${projectName}`, '', '## GENERACION ACTUAL', '', 'Generacion: 0', ''].join('\n') // prettier-ignore
}

/** Texto entre dos marcadores (o hasta el final si `to` es null). Para acumular. */
function between(existing: string, from: string, to: string | null): string {
  const start = existing.indexOf(from)
  if (start === -1) return ''
  const rest = existing.slice(start + from.length)
  const end = to === null ? -1 : rest.indexOf(to)
  return (end === -1 ? rest : rest.slice(0, end)).trim()
}

/**
 * Reconstruye el COGNITION-LOG tras un escaneo: patrones ACTIVE regenerados de los
 * hallazgos actuales; los EXTINTOS y las reflexiones SE ACUMULAN (los resueltos y la
 * historia no desaparecen). Un hallazgo resuelto se registra extinto, no se cae.
 *
 * Los ids salen del contenido del hallazgo, no de su posicion, y la fecha de
 * primera deteccion se hereda del log anterior: reescribir la seccion no borra
 * desde cuando se conoce cada patron. Los extintos ya escritos con el esquema
 * viejo se migran al pasar, de modo que el log converge sin intervencion.
 */
export function rebuildLog(
  existing: string,
  projectName: string,
  findings: readonly DetectedFinding[],
  resolved: readonly DetectedFinding[],
  score: number,
  counts: SeverityCounts,
  at: string
): string {
  const seen = readFirstSeen(existing)
  const nueva = buildReflectionEntry(projectName, at, score, counts).trim()
  const reflexiones = [between(existing, MARKER, null), nueva].filter(Boolean).join('\n\n')
  const extintos = [
    migrateExtinct(between(existing, EXTINCT, MARKER)).trim(),
    buildExtinct(resolved, at, seen).trim()
  ]
    .filter(Boolean)
    .join('\n\n')

  return [header(projectName), buildAttention(findings), buildPatterns(findings, at, seen),
    EXTINCT, '', extintos, '', MARKER, '', reflexiones, ''].join('\n') // prettier-ignore
}
