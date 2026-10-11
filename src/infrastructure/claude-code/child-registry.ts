import type { ChildProcess } from 'child_process'
import { senalAl, type ModoDeMuerte } from './kill-signal'
import { terminarConGracia } from './escalada-de-kill'

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
interface Ficha {
  readonly owner: string | null
  /** Un detached hay que matarlo por grupo o no muere. Lo declara quien lo
   *  spawneo, que es el unico que sabe como lo lanzo. */
  readonly modo: ModoDeMuerte
}

const alive = new Map<ChildProcess, Ficha>()

export function trackChild(
  child: ChildProcess,
  owner: string | null = null,
  modo: ModoDeMuerte = 'proceso'
): void {
  alive.set(child, { owner, modo })
  // Se descuenta solo: un proceso que ya termino no hay que matarlo.
  child.once('close', () => alive.delete(child))
  child.once('error', () => alive.delete(child))
}

export function liveChildCount(): number {
  return alive.size
}

type Ejecutar = (child: ChildProcess, modo: ModoDeMuerte) => void

/** Mata los que cumplen el criterio con el ejecutor dado y devuelve cuantos. Se
 *  borran del registro AQUI y no solo al cerrarse: un proceso que no responde
 *  nunca emite close y se quedaria contado para siempre. */
function matar(cumple: (owner: string | null) => boolean, ejecutar: Ejecutar): number {
  let total = 0
  for (const [child, ficha] of [...alive]) {
    if (!cumple(ficha.owner)) continue
    total += 1
    alive.delete(child)
    ejecutar(child, ficha.modo)
  }
  return total
}

/** Los hijos de UN proyecto, con la gracia del Detener. Parar es una decision
 *  sobre el trabajo propio; antes se llevaba por delante el de todos. */
export function killChildrenOf(projectId: string): number {
  return matar((owner) => owner === projectId, terminarConGracia)
}

/** TODOS, con gracia. El boton de mantenimiento. */
export function killAllChildren(): number {
  return matar(() => true, terminarConGracia)
}

/** El APAGADO: SIGKILL YA a todos, SIN la gracia —su timer unref no dispara en
 *  un loop que se muere y el hijo (reindex, pipes abiertos) retiene el main. */
export function matarYaATodos(): number {
  return matar(
    () => true,
    (child, modo) => senalAl(child, 'SIGKILL', modo)
  )
}
