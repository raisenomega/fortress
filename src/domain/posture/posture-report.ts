import { SEVERITIES, type Severity } from '../shared/severity'
import type { PostureFinding } from './posture-finding'
import { postureScore } from './posture-score'

function group(findings: readonly PostureFinding[], severity: Severity): readonly string[] {
  const items = findings.filter((f) => f.severity === severity)
  if (items.length === 0) return []

  return [
    '',
    `### ${severity} (${items.length})`,
    ...items.flatMap((f) => [`- **${f.title}** — ${f.evidence}`, `  Fix: ${f.fix}`])
  ]
}

/** Informe de exposicion externa, en markdown, listo para el chat. */
export function buildPostureReport(host: string, findings: readonly PostureFinding[]): string {
  const score = postureScore(findings)
  const resumen = findings.length === 0 ? 'sin hallazgos' : `${findings.length} hallazgos`

  return [
    `## Exposicion externa de ${host}`,
    '',
    `Puntuacion: ${score}/100 · ${resumen}`,
    `Analisis de solo lectura. Ningun ataque, ninguna carga que modifique nada.`,
    ...SEVERITIES.flatMap((severity) => group(findings, severity))
  ].join('\n')
}
