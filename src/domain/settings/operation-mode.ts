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
 * La otra degradacion que se explica (ADR-079): sin red no se escribe.
 *
 * Nombra las DOS causas porque decia solo la primera, y en un repo que YA tenia
 * git —lo que le faltaba era identidad— el consejo «inicia git» mandaba al
 * cliente a hacer algo que no arreglaba nada. Un aviso que da el remedio
 * equivocado gasta mas tiempo que uno que no dice nada.
 */
export const SIN_RED_GIT_SUPERVISADO =
  '\n\n---\nNo puedo editar aqui sin red de seguridad, asi que trabajo en supervisado: ' +
  'analizo y propongo, no edito. O no hay repositorio git en la raiz del proyecto, o ' +
  'git no tiene identidad configurada (user.email / user.name). Configuralo y podre ' +
  'resolver.'

/**
 * Por que no se tuvo el autonomo que se pidio, dicho al final de la respuesta.
 * El repo propio manda sobre la red: es la razon mas fuerte y la que el operador
 * tiene que leer. Area protegida y falta de confianza no avisan, como hasta hoy.
 */
export function avisoDeDegradacion(
  pedido: OperationMode,
  selfRepo: boolean,
  redGit: boolean
): string {
  if (pedido !== 'autonomo') return ''
  if (selfRepo) return SELF_REPO_SUPERVISED
  return redGit ? '' : SIN_RED_GIT_SUPERVISADO
}
