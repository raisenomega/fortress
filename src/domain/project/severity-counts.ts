import { SEVERITIES, type HasSeverity, type Severity } from '../shared/severity'

export type SeverityCounts = Readonly<Record<Severity, number>>

/** Un proyecto sin hallazgos y uno sin escanear cuentan igual: hay que mirar
 *  lastScan para distinguirlos, nunca este objeto. */
export const EMPTY_COUNTS: SeverityCounts = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }

export function countFindings(findings: readonly HasSeverity[]): SeverityCounts {
  const counts: Record<Severity, number> = { ...EMPTY_COUNTS }
  for (const finding of findings) counts[finding.severity] += 1
  return counts
}

export function totalFindings(counts: SeverityCounts): number {
  return SEVERITIES.reduce((total, severity) => total + counts[severity], 0)
}

/** Severidades presentes, de la mas urgente a la menos, para pintar resumenes. */
export function presentSeverities(counts: SeverityCounts): readonly Severity[] {
  return SEVERITIES.filter((severity) => counts[severity] > 0)
}
