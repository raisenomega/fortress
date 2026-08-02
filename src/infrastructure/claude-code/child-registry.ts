import type { ChildProcess } from 'child_process'

/**
 * Procesos `claude` vivos. Existe porque un escaneo puede tardar minutos y, si
 * se queda colgado, sigue ocupando memoria sin que nadie lo vea: cerrar la app
 * era la unica forma de recuperarla. Con el registro se pueden terminar sin
 * reiniciar nada.
 */
const alive = new Set<ChildProcess>()

export function trackChild(child: ChildProcess): void {
  alive.add(child)
  // Se descuenta solo: un proceso que ya termino no hay que matarlo.
  child.once('close', () => alive.delete(child))
  child.once('error', () => alive.delete(child))
}

export function liveChildCount(): number {
  return alive.size
}

/**
 * Termina todos y devuelve cuantos habia. SIGTERM y no SIGKILL: se le da al
 * proceso la oportunidad de cerrar sus descriptores antes de desaparecer.
 */
export function killAllChildren(): number {
  const total = alive.size

  for (const child of alive) {
    try {
      child.kill('SIGTERM')
    } catch {
      // Ya estaba muerto: da igual, el registro se vacia igualmente.
    }
  }

  // Se vacia aqui y no solo en el listener de close. Un proceso que no
  // responde nunca emite close, y se quedaria contado para siempre: el boton
  // de reinicio diria "hay 3 procesos" para el resto de la sesion.
  alive.clear()

  return total
}
