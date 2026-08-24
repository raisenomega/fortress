import type { AppContext } from '@application/context'
import { readBudget, sinMedirHoy, spentToday } from '@application/settings/read-budget'
import { CONTAMINATED_BLOCK } from '@domain/probe/contamination'
import { dayLimitReached } from '@domain/settings/run-budget'
import { tryBeginMerge, tryBeginRun } from './run-control'

const BUSY =
  'Ya hay una ejecucion en marcha en este proyecto. Espera a que termine o pulsa Detener.'

const MERGE_BUSY = 'Ya se esta integrando otra propuesta en este proyecto. Espera a que termine.'

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
  const bloqueo = contaminado(context, projectId)
  if (bloqueo !== null) return bloqueo

  const ahora = new Date()
  const limite = dayLimitReached(readBudget(context), spentToday(context, ahora), () =>
    sinMedirHoy(context, ahora)
  )
  if (limite !== null) return limite

  return tryBeginRun(projectId) ? null : BUSY
}

/** Circuit breaker (Capa 4): un proyecto contaminado se bloquea hasta revision
 *  humana. Vale para cualquier accion, gaste tokens o no. */
function contaminado(context: AppContext, projectId: string): string | null {
  return context.projects.findById(projectId)?.contaminated === true ? CONTAMINATED_BLOCK : null
}

/**
 * Lo que hay que comprobar antes de FIRMAR. Dos diferencias con `guardRun`, y
 * ninguna es un descuido:
 *
 * El tope diario no aplica: la firma no gasta un token, aplica un fix que ya
 * esta pagado y juzgado. Negarla por haber gastado mucho hoy dejaria trabajo
 * terminado sin poder cobrarlo.
 *
 * El circuit breaker SI aplica, aunque no sea una cuestion de gasto: un
 * proyecto contaminado esta bloqueado "hasta revision humana antes de volver a
 * tocarlo", y un merge sobre la rama activa es lo mas tocarlo que hay.
 */
export function guardMerge(context: AppContext, projectId: string): string | null {
  const bloqueo = contaminado(context, projectId)
  if (bloqueo !== null) return bloqueo

  return tryBeginMerge(projectId) ? null : MERGE_BUSY
}
