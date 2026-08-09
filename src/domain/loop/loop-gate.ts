/**
 * Gate del loop autonomo, para aplicarlo en el MAIN. La UI muestra los mismos
 * requisitos, pero la unica guardia que cuenta es la del main: al canal IPC se
 * le puede llamar sin pasar por el renderer.
 */
export interface LoopGateInput {
  /** El operador confia en el proyecto (el loop EDITA codigo del repo). */
  readonly trusted: boolean
  /** true si el proyecto ES el propio repo de FORTRESS. */
  readonly selfRepo: boolean
  /** Topes del loop fijados y positivos (loopConfigured). */
  readonly configured: boolean
}

export const LOOP_SELF_REPO_BLOCK =
  'El loop autonomo no corre sobre el propio repo de FORTRESS: repara editando ' +
  'el arbol vivo, sin aislamiento. El codigo propio solo se toca por el motor ' +
  'de reparacion disciplinado (worktree + gate + OMEGA + firma humana).'

/**
 * Motivo por el que el loop NO puede correr, o null si puede.
 *
 * El repo propio va primero y es INCONDICIONAL: ni la confianza ni los topes
 * lo desbloquean. Hasta que el motor disciplinado sustituya la fase de
 * reparacion, el loop solo puede trabajar sobre OTROS proyectos.
 */
export function loopBlocked(input: LoopGateInput): string | null {
  if (input.selfRepo) return LOOP_SELF_REPO_BLOCK
  if (!input.trusted) return 'El loop exige un proyecto de confianza: edita codigo del repo'
  if (!input.configured) return 'Fija y guarda los topes del loop en Configuracion'
  return null
}
