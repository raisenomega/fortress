/**
 * Modo de operacion del agente (ver docs/FLOWS/CHAT.md).
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

export { isProtectedArea, PROTECTED_AREAS } from './protected-areas'

/**
 * Lo que se le dice al operador cuando el objetivo es el propio repo. No es un
 * rechazo: leer y analizar FORTRESS desde el Terminal es util y no arriesga
 * nada. Lo que no puede pasar es que APLIQUE.
 */
export const SELF_REPO_SUPERVISED =
  '\n\n---\nSobre el propio repo de FORTRESS trabajo en supervisado: leo, analizo ' +
  'y propongo, pero no aplico. Los cambios en el codigo propio pasan por el motor ' +
  'de Auto-mejora (worktree aislado + gate + revisor + firma humana).'

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
