export type HealthLevel = 'ok' | 'warning' | 'error'

export interface HealthCheck {
  readonly id: string
  readonly label: string
  readonly level: HealthLevel
  readonly detail: string
  /** Que hacer para arreglarlo. null cuando no hay nada que arreglar. */
  readonly fix: string | null
}

export interface HealthReport {
  readonly level: HealthLevel
  readonly checks: readonly HealthCheck[]
  readonly checkedAt: string
}

const SEVERITY: Record<HealthLevel, number> = { ok: 0, warning: 1, error: 2 }

/** El nivel global es el del peor check: un error no lo tapa ningun ok. */
export function overallLevel(checks: readonly HealthCheck[]): HealthLevel {
  return checks.reduce<HealthLevel>(
    (worst, check) => (SEVERITY[check.level] > SEVERITY[worst] ? check.level : worst),
    'ok'
  )
}

export const LEVEL_ICON: Record<HealthLevel, string> = {
  ok: '🟢',
  warning: '🟡',
  error: '🔴'
}

export const LEVEL_LABEL: Record<HealthLevel, string> = {
  ok: 'Sistema OK',
  warning: 'Advertencia',
  error: 'Error'
}

export function problemsOf(report: HealthReport): readonly HealthCheck[] {
  return report.checks.filter((check) => check.level !== 'ok')
}
