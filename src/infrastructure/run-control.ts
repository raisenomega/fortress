import { killAllChildren } from './claude-code/child-registry'

/**
 * Control de las ejecuciones en marcha. Hace dos cosas:
 *
 * 1. Permite detener un workflow. Un "listo para produccion" son siete agentes
 *    y varios minutos: sin esto, arrancarlo por error obligaba a esperar.
 * 2. Impide dos ejecuciones a la vez en el mismo proyecto. La guardia vivia
 *    solo en el renderer, asi que quien llamara al canal IPC directamente
 *    podia lanzar diez escaneos simultaneos. No es un agujero de seguridad:
 *    es la cuota del operador multiplicada por diez.
 */
const running = new Set<string>()
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
 * Marca la cancelacion y corta el paso que este corriendo ahora mismo. Las dos
 * cosas hacen falta: la marca evita que arranquen los pasos siguientes, y
 * matar el proceso termina el actual sin esperar sus minutos.
 */
export function cancelRun(projectId: string): number {
  cancelled.add(projectId)
  return killAllChildren()
}

export function endRun(projectId: string): void {
  running.delete(projectId)
  cancelled.delete(projectId)
}
