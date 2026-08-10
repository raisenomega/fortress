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

/** Cuanto se le concede a un proceso para morir por las buenas tras SIGTERM. */
const GRACE_MS = 3000

/**
 * Termina todos y devuelve cuantos habia. Primero SIGTERM (que cierre sus
 * descriptores); si a los 3s sigue vivo, SIGKILL: inatrapable. SIGTERM es una
 * PETICION y claude puede ignorarla — paso en vivo (2026-08-09): Detener
 * "no funcionaba" porque el run seguia streameando tras el SIGTERM.
 */
export function killAllChildren(): number {
  const total = alive.size

  for (const child of alive) {
    try {
      child.kill('SIGTERM')
    } catch {
      continue // Ya estaba muerto: no hay nada que escalar.
    }
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

  // Se vacia aqui y no solo en el listener de close. Un proceso que no
  // responde nunca emite close, y se quedaria contado para siempre: el boton
  // de reinicio diria "hay 3 procesos" para el resto de la sesion.
  alive.clear()

  return total
}
