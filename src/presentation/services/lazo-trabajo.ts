import { totalFindings } from '@domain/project/severity-counts'
import { useLazoStore } from '../stores/lazo-store'
import { useScanStore } from '../stores/scan-store'

/** Tope de vueltas por defecto del lazo. Hacerlo configurable toca el repo de
 *  settings FIRMADO (la whitelist de claves publicas): FRONTERA aparte. */
export const MAX_VUELTAS_DEFECTO = 8

/** Empujones sin PASO antes de rendirse: UNO. Si tras el empujon el CTO sigue
 *  sin proponer, el lazo esta estancado y para —no se badgea en bucle—. */
export const MAX_SIN_AVANZAR = 1

/**
 * El `nadaQueHacer` de `lazoStop`, alimentado desde el renderer: NO queda
 * trabajo si el proyecto del lazo no tiene hallazgos vivos (conteo del escaneo),
 * O si el lazo esta estancado —ya se empujo al CTO y sigue sin PASO—. El
 * estancamiento es el "idle" hecho DETERMINISTA: turnos sin avanzar, no reloj
 * (un turno largo legitimo no es idle; un CTO que no propone, si).
 */
export function nadaQueHacerAhora(projectId: string | null): boolean {
  const lazo = useLazoStore.getState()
  // La cola CONGELADA manda: es el candado del lazo. Vacia => nada que hacer.
  if (lazo.cola !== null) return lazo.cola.length === 0 || lazo.sinAvanzar >= MAX_SIN_AVANZAR
  // Sin cola cargada: el fallback de siempre (conteo del escaneo vigente).
  if (projectId === null) return true
  const counts = useScanStore.getState().counts[projectId]
  if (counts === undefined || totalFindings(counts) === 0) return true
  return lazo.sinAvanzar >= MAX_SIN_AVANZAR
}
