import type { DetectedFinding } from '../scan/detected-finding'
import type { Severity } from '../shared/severity'

/** Conteo de vulnerabilidades de `npm audit` por severidad. */
export interface AuditCounts {
  readonly critical: number
  readonly high: number
  readonly moderate: number
  readonly low: number
}

const MAP: ReadonlyArray<readonly [keyof AuditCounts, Severity]> = [
  ['critical', 'CRITICAL'],
  ['high', 'HIGH'],
  ['moderate', 'MEDIUM'],
  ['low', 'LOW']
]

/**
 * Un hallazgo por VULNERABILIDAD (hasta 8 por severidad para no inundar el
 * penalty): asi el score baja con la cantidad real, y un CVE critical topa el
 * global via el techo. Cero vulns = dimension limpia (100).
 */
export function auditFindings(counts: AuditCounts): DetectedFinding[] {
  const out: DetectedFinding[] = []
  for (const [key, severity] of MAP) {
    const n = Math.min(counts[key], 8)
    for (let i = 0; i < n; i += 1) {
      out.push({
        severity,
        title: `Dependencia con vulnerabilidad ${severity}`,
        file: '',
        line: null
      })
    }
  }
  return out
}
