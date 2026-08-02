/**
 * Modo de operacion del agente (ver CLAUDE.md raiz).
 * - supervisado: propone cambios y espera aprobacion.
 * - autonomo: aplica cambios y reporta resultados.
 */
export const OPERATION_MODES = ['supervisado', 'autonomo'] as const

export type OperationMode = (typeof OPERATION_MODES)[number]

export const DEFAULT_OPERATION_MODE: OperationMode = 'supervisado'

/** Lo guardado puede venir de una version anterior o corrupto: nunca se confia. */
export function parseOperationMode(value: string | null): OperationMode {
  return OPERATION_MODES.includes(value as OperationMode)
    ? (value as OperationMode)
    : DEFAULT_OPERATION_MODE
}

/**
 * Areas que nunca se tocan en modo autonomo: al detectarlas el agente
 * vuelve a supervisado automaticamente.
 */
export const PROTECTED_AREAS = ['auth', 'payments', 'rls', 'security'] as const

export function isProtectedArea(text: string): boolean {
  const lowered = text.toLowerCase()
  return PROTECTED_AREAS.some((area) => lowered.includes(area))
}

/** El modo efectivo degrada a supervisado si la peticion toca un area protegida. */
export function effectiveMode(mode: OperationMode, request: string): OperationMode {
  if (mode === 'autonomo' && isProtectedArea(request)) return 'supervisado'
  return mode
}
