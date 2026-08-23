import { killChildrenOf } from './claude-code/child-registry'

/**
 * Control de las ejecuciones en marcha. Hace dos cosas:
 *
 * 1. Permite detener un workflow. Un "listo para produccion" son siete agentes
 *    y varios minutos: sin esto, arrancarlo por error obligaba a esperar.
 * 2. Impide dos ejecuciones a la vez en el mismo proyecto. La guardia vivia
 *    solo en el renderer, asi que quien llamara al canal IPC directamente
 *    podia lanzar diez escaneos simultaneos. No es un agujero de seguridad:
 *    es la cuota del operador multiplicada por diez.
 *
 * Son DOS turnos y no uno, porque son dos recursos. El motor trabaja en
 * worktrees aislados y no toca la rama activa; el merge de una firma la toca y
 * no entra en ningun worktree. Con un solo turno, un drenaje de media hora
 * cerraba el proyecto a la firma, al escaneo y al chat sin que hubiera nada que
 * proteger. Cada turno sigue siendo exclusivo consigo mismo: dos merges a la
 * vez si colisionan, y dos drenajes tambien.
 */
const running = new Set<string>()
const merging = new Set<string>()
const cancelled = new Set<string>()

/** Falso si ya hay una ejecucion en ese proyecto. Reservar y comprobar van
 *  juntos a proposito: separarlos deja hueco para colar una segunda. */
export function tryBeginRun(projectId: string): boolean {
  if (running.has(projectId)) return false

  running.add(projectId)
  cancelled.delete(projectId)
  return true
}

export function isRunning(projectId: string): boolean {
  return running.has(projectId)
}

export function isCancelled(projectId: string): boolean {
  return cancelled.has(projectId)
}

/**
 * Marca la cancelacion y corta el paso que corre ahora mismo: la marca evita
 * que arranquen los siguientes, y matar el proceso termina el actual.
 *
 * Mata SOLO los hijos de este proyecto. Antes los mataba todos, asi que parar
 * uno interrumpia a los demas y encima se lo apuntaba como averia: lo que
 * distingue una parada de un fallo mira `cancelled`, y el atropellado no estaba.
 */
export function cancelRun(projectId: string): number {
  cancelled.add(projectId)
  return killChildrenOf(projectId)
}

export function endRun(projectId: string): void {
  running.delete(projectId)
  cancelled.delete(projectId)
}

/** Turno del MERGE. Exclusivo consigo mismo —dos merges a la vez se pisan— y
 *  ajeno al del motor: la firma no espera a que el drenaje termine. */
export function tryBeginMerge(projectId: string): boolean {
  if (merging.has(projectId)) return false

  merging.add(projectId)
  return true
}

/**
 * Suelta el turno del merge y NADA mas. No toca `cancelled`: esa marca es del
 * motor, y borrarla al terminar una firma le quitaria al drenaje su orden de
 * parar. */
export function endMerge(projectId: string): void {
  merging.delete(projectId)
}
