/** Escala de severidad FORTRESS, de mayor a menor urgencia. */
export const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

export type Severity = (typeof SEVERITIES)[number]

/** Lo minimo que necesita saberse de un hallazgo para pesarlo o contarlo. */
export interface HasSeverity {
  readonly severity: Severity
}

/** Guardia para datos que vienen de fuera: informes del agente, filas viejas. */
export function isSeverity(value: unknown): value is Severity {
  return typeof value === 'string' && (SEVERITIES as readonly string[]).includes(value)
}

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

/** La mas urgente de un grupo. Existe aqui, junto al peso, para que nadie
 *  vuelva a decidir en otro sitio cual pesa mas: hay una sola autoridad. */
export function masUrgente(severities: readonly Severity[]): Severity {
  return severities.reduce((a, b) => (compareSeverity(a, b) <= 0 ? a : b))
}
