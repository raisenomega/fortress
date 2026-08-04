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
 * Areas que nunca se tocan en modo autonomo: al detectarlas el agente vuelve a
 * supervisado. Cubre ES + EN porque el operador escribe en espanol y el freno
 * fallaba en silencio: "autenticacion" no contiene "auth". Sobre-degradar es
 * seguro (como mucho pide permiso de mas); infra-degradar es el peligro. Los
 * terminos van sin tildes; la comparacion normaliza acentos antes de buscar.
 */
// Por categoria (cada linea): auth/sesion · pagos · bd/permisos · secretos/cifrado.
const PROTECTED_WORDS =
  'auth autenticacion autorizacion login sesion credencial contrasena password ' +
  'payment pago cobro facturacion tarjeta checkout ' +
  'rls politica permiso ' +
  'security seguridad secret secreto token clave cifrad encript encrypt'

export const PROTECTED_AREAS = PROTECTED_WORDS.split(' ')

/** Quita tildes/diacriticos: "autenticacion" debe casar con "autenticación". */
function stripAccents(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

export function isProtectedArea(text: string): boolean {
  const lowered = stripAccents(text.toLowerCase())
  return PROTECTED_AREAS.some((area) => lowered.includes(area))
}

/** El modo efectivo degrada a supervisado si la peticion toca un area protegida. */
export function effectiveMode(mode: OperationMode, request: string): OperationMode {
  if (mode === 'autonomo' && isProtectedArea(request)) return 'supervisado'
  return mode
}

/**
 * Lo que se le dice al agente sobre su modo. Vive en el dominio para que lo
 * usen las dos rutas: el system prompt de la API y el prompt de cada paso del
 * workflow. Antes solo lo tenia la API, asi que en un workflow el agente no
 * sabia en que modo estaba y respondia "supervisado por defecto" aunque el
 * operador lo hubiera puesto en autonomo.
 */
export const MODE_INSTRUCTION: Record<OperationMode, string> = {
  supervisado:
    'MODO SUPERVISADO: propon los cambios y espera aprobacion. No apliques nada ' +
    'sin confirmacion. Muestra el impacto antes de cada cambio.',
  autonomo:
    'MODO AUTONOMO: aplica los cambios y reporta resultados. Corre los tests antes ' +
    'y despues. Si algo falla, revierte. NUNCA toques auth, payments, RLS ni ' +
    'seguridad sin volver a supervisado.'
}
