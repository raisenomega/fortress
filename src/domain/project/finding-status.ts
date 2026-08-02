export const FINDING_STATUSES = ['open', 'false_positive'] as const

export type FindingStatus = (typeof FINDING_STATUSES)[number]

export function isFindingStatus(value: unknown): value is FindingStatus {
  return typeof value === 'string' && (FINDING_STATUSES as readonly string[]).includes(value)
}

/**
 * Solo lo abierto cuenta para el score y para bloquear el push. Descartar un
 * hallazgo es una decision del operador y tiene consecuencias reales: si
 * descarta un CRITICAL, el push se desbloquea. Por eso se ve en pantalla en
 * vez de desaparecer, y por eso queda registrado con fecha.
 */
export function isOpen(status: FindingStatus): boolean {
  return status === 'open'
}
