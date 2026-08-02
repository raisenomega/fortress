import type { AppContext } from '@application/context'
import { readBudget, spentToday } from '@application/settings/read-budget'
import { dayLimitReached } from '@domain/settings/run-budget'
import { tryBeginRun } from './run-control'

const BUSY =
  'Ya hay una ejecucion en marcha en este proyecto. Espera a que termine o pulsa Detener.'

/**
 * Lo que hay que comprobar ANTES de gastar: el tope diario y que no haya ya
 * otra ejecucion en ese proyecto. Las dos guardias vivian en el renderer, y
 * ahi se las salta cualquiera que llame al canal IPC directamente.
 *
 * Devuelve el motivo del rechazo, o null si se puede seguir. Reserva el turno
 * cuando devuelve null: comprobar y reservar por separado deja hueco para
 * colar una segunda ejecucion entre las dos operaciones.
 */
export function guardRun(context: AppContext, projectId: string): string | null {
  const limite = dayLimitReached(readBudget(context), spentToday(context, new Date()))
  if (limite !== null) return limite

  return tryBeginRun(projectId) ? null : BUSY
}
