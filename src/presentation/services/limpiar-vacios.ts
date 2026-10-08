import { useBarraStore } from '../stores/barra-store'
import { useConstruirStore } from '../stores/construir-store'
import { elPuerto } from './hilo-activo'

/**
 * Revision A (PASO 120): un hilo de LIBRE con cero mensajes y sin draft en
 * vuelo muere cuando deja de ser el activo — cero filas vacias. Decide sobre
 * la MEMORIA en el instante de salir (las bocas persistidas escriben memoria
 * PRIMERO, asi que memoria >= cajon: cero en memoria no deja nada en vuelo
 * que perder) y el cajon da la segunda llave antes del borrado irreversible.
 */
export async function limpiarAlSalir(): Promise<void> {
  const s = useConstruirStore.getState()
  const hilo = s.hiloActivo
  if (hilo === null || hilo.modo !== 'libre' || hilo.projectId !== null) return
  if (s.messages.length > 0 || s.draft !== null) return
  if ((await elPuerto().listByHilo(hilo.id)).length > 0) return
  await elPuerto().borrarHilo(hilo.id)
}

let barrido = false

/**
 * El «cerrar» del contrato: borrar DURANTE el cierre no es fiable (el IPC
 * async puede no llegar), asi que los vacios de la sesion anterior se barren
 * al ARRANCAR, antes de la primera rehidratacion. Solo el plano de libre
 * (listHilos(null)); el activo y la seleccion vivos jamas se barren.
 */
export async function barrerVaciosUnaVez(): Promise<void> {
  if (barrido) return
  barrido = true
  const vivos = new Set([useBarraStore.getState().seleccion, useConstruirStore.getState().hiloActivo?.id]) // prettier-ignore
  for (const hilo of await elPuerto().listHilos(null)) {
    if (vivos.has(hilo.id)) continue
    if ((await elPuerto().listByHilo(hilo.id)).length === 0) await elPuerto().borrarHilo(hilo.id)
  }
}

/** SOLO tests: rearmar el barrido de arranque. */
export const _resetBarrido = (): void => void (barrido = false)
