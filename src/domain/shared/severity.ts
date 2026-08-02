/** Escala de severidad FORTRESS, de mayor a menor urgencia. */
export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

export type Severity = (typeof SEVERITIES)[number]

/** Peso para ordenar hallazgos: mayor numero = mas urgente. */
const WEIGHT: Record<Severity, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
}

export function compareSeverity(a: Severity, b: Severity): number {
  return WEIGHT[b] - WEIGHT[a]
}
