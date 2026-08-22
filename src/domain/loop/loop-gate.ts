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
  /** El loop va a correr HASTA EL GATE: recorre y acumula, jamas integra. */
  readonly hastaGate: boolean
}

export const LOOP_SELF_REPO_BLOCK =
  'Sobre el propio repo de FORTRESS el loop solo corre hasta el gate: acumula ' +
  'propuestas y espera firma humana. Integrar en el codigo propio sin que un ' +
  'humano lo autorice no se permite por ninguna via.'

/**
 * En que modo corre el loop sobre este proyecto. Es una FUNCION y no un ajuste
 * a proposito: un modo que se pueda elegir es un modo que alguien elegira mal
 * sobre el repo propio. La consumen las dos mitades —el gate, que bloquea si no
 * cuadra, y quien arma el motor, que pasa la bandera—, asi que no pueden
 * desincronizarse. Si un dia se vuelve configurable, esa desincronizacion es lo
 * primero que hay que impedir.
 */
export const esHastaGate = (selfRepo: boolean): boolean => selfRepo

/**
 * Motivo por el que el loop NO puede correr, o null si puede.
 *
 * El repo propio estuvo bloqueado sin condicion mientras la fase de reparacion
 * editaba el arbol vivo. Ya no: el motor disciplinado la sustituyo —worktree
 * aislado, gate, revisor, politica— y la parada tras el gate permite recorrer
 * sin integrar. Lo que queda prohibido no es TRABAJAR sobre el codigo propio,
 * que ocurre entero dentro de un worktree y es inocuo, sino INTEGRARLO sin
 * firma. Por eso la condicion es el modo y no el proyecto.
 */
export function loopBlocked(input: LoopGateInput): string | null {
  if (input.selfRepo && !input.hastaGate) return LOOP_SELF_REPO_BLOCK
  if (!input.trusted) return 'El loop exige un proyecto de confianza: edita codigo del repo'
  if (!input.configured) return 'Fija y guarda los topes del loop en Configuracion'
  return null
}
