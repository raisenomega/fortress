import { scoreFromFindings } from './score-from-findings'
import type { HasSeverity } from '../shared/severity'

type Scored = HasSeverity & { readonly agentId: string }

/**
 * Que dimension de calidad cubre cada agente. La CALIDAD GENERAL las abarca todas:
 * no solo ciberseguridad, sino bugs, tests, limpieza, arquitectura e integridad.
 */
const DIMENSION: Readonly<Record<string, string>> = {
  'security-reviewer': 'Seguridad',
  'code-reviewer': 'Bugs y calidad',
  'refactor-cleaner': 'Limpieza',
  'tdd-guide': 'Tests',
  'build-error-resolver': 'Build',
  'e2e-runner': 'E2E',
  'code-simplifier': 'Simplicidad',
  planner: 'Arquitectura',
  'sentinel-omega': 'Integridad',
  'opensource-sanitizer': 'Publicacion'
}

export interface QualityBreakdown {
  readonly dimension: string
  readonly score: number
  readonly count: number
}

export interface QualityScore {
  /**
   * Calidad GENERAL: la severidad de TODOS los hallazgos. Una CRITICAL (p.ej. de
   * seguridad) topa el numero via scoreFromFindings: la seguridad sigue de porton.
   */
  readonly overall: number
  readonly byDimension: readonly QualityBreakdown[]
}

/** Score de calidad general + su desglose por dimension (por agente). */
export function computeQualityScore(findings: readonly Scored[]): QualityScore {
  const groups = new Map<string, Scored[]>()
  for (const finding of findings) {
    const dim = DIMENSION[finding.agentId] ?? 'Otros'
    const list = groups.get(dim) ?? []
    list.push(finding)
    groups.set(dim, list)
  }
  const byDimension = [...groups.entries()].map(([dimension, list]) => ({
    dimension,
    score: scoreFromFindings(list),
    count: list.length
  }))
  return { overall: scoreFromFindings(findings), byDimension }
}

/** Lineas markdown del desglose, para el informe de una auditoria integral. */
export function qualityReportLines(score: QualityScore): readonly string[] {
  return [
    `Calidad general: ${score.overall}/100 (todas las dimensiones; una CRITICAL la tope)`,
    ...score.byDimension.map((d) => `- ${d.dimension}: ${d.score}/100 · ${d.count} hallazgos`)
  ]
}
