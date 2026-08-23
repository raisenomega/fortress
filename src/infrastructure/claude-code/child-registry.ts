import type { ChildProcess } from 'child_process'

/**
 * Procesos `claude` vivos, CON el proyecto al que pertenecen. Existe porque un
 * escaneo puede tardar minutos y, si se queda colgado, sigue ocupando memoria
 * sin que nadie lo vea: cerrar la app era la unica forma de recuperarla.
 *
 * El dueno es el mismo id que usa el candado de ejecucion, no la ruta del
 * proyecto: dos claves para la misma cosa acaban discrepando. `null` es un hijo
 * que no es de ningun proyecto —el login, un sandbox de aprendizaje— y a esos
 * no los alcanza la parada de nadie; solo el boton de mantenimiento.
 */
const alive = new Map<ChildProcess, string | null>()

export function trackChild(child: ChildProcess, owner: string | null = null): void {
  alive.set(child, owner)
  // Se descuenta solo: un proceso que ya termino no hay que matarlo.
  child.once('close', () => alive.delete(child))
  child.once('error', () => alive.delete(child))
}

export function liveChildCount(): number {
  return alive.size
}

/** Cuanto se le concede a un proceso para morir por las buenas tras SIGTERM. */
const GRACE_MS = 3000

/** SIGTERM y, a los 3s, SIGKILL. SIGTERM es una PETICION y claude puede
 *  ignorarla — paso en vivo (2026-08-09): Detener "no funcionaba" porque el run
 *  seguia streameando tras recibirla. */
function terminar(child: ChildProcess): void {
  child.kill('SIGTERM')
  const escalation = setTimeout(() => {
    try {
      child.kill('SIGKILL')
    } catch {
      // Murio entre el timer y la senal: perfecto.
    }
  }, GRACE_MS)
  escalation.unref()
  child.once('close', () => clearTimeout(escalation))
}

/** Termina los que cumplen el criterio y devuelve cuantos eran. Se borran del
 *  registro AQUI y no solo al cerrarse: un proceso que no responde nunca emite
 *  close y se quedaria contado para siempre. */
function matar(cumple: (owner: string | null) => boolean): number {
  let total = 0
  for (const [child, owner] of [...alive]) {
    if (!cumple(owner)) continue
    total += 1
    alive.delete(child)
    try {
      terminar(child)
    } catch {
      continue // Ya estaba muerto: no hay nada que escalar.
    }
  }
  return total
}

/** Los hijos de UN proyecto. Parar es una decision sobre el trabajo propio, y
 *  antes se llevaba por delante el de todos: parar el drenaje de uno mataba el
 *  escaneo de otro, que ademas lo anotaba como averia del proveedor porque su
 *  proyecto no constaba como cancelado. */
export function killChildrenOf(projectId: string): number {
  return matar((owner) => owner === projectId)
}

/** TODOS, sin dueno que valga. Solo para el boton de mantenimiento. */
export function killAllChildren(): number {
  return matar(() => true)
}
