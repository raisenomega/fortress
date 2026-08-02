import { killAllChildren } from './claude-code/child-registry'

/**
 * Permite detener un workflow en marcha. Un "listo para produccion" son siete
 * agentes y varios minutos: sin esto, arrancarlo por error obligaba a esperar
 * a que terminara o a cerrar la app.
 */
const cancelled = new Set<string>()

export function beginRun(projectId: string): void {
  cancelled.delete(projectId)
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
  cancelled.delete(projectId)
}
