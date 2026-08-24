import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import { parseBudget, type Budget } from '@domain/settings/run-budget'
import { windowStart } from '@domain/telemetry/time-window'
import type { AppContext } from '../context'

/** El tope que el operador configuro, o los valores por defecto. */
export function readBudget(context: AppContext): Budget {
  return parseBudget(
    context.settings.get(SETTINGS_KEYS.budgetPerRun),
    context.settings.get(SETTINGS_KEYS.budgetPerDay)
  )
}

/**
 * Gasto de hoy, desde medianoche. Se calcula con las ejecuciones ya
 * registradas: es lo unico que FORTRESS sabe con certeza de lo que va
 * consumiendo.
 */
export function spentToday(context: AppContext, now: Date): number {
  return context.runs.usageSince(windowStart(now, 'hoy')).costUsd
}

/**
 * Cuantas corridas de HOY ocurrieron sin que se pudiera medir su coste.
 *
 * Acompana a `spentToday` y no lo modifica: el gasto que les falta no existe en
 * ningun sitio y estimarlo subestimaria justo donde duele, porque las que se
 * quedan sin factura son las largas. Lo unico honesto es decir cuantas son.
 */
export function sinMedirHoy(context: AppContext, now: Date): number {
  return context.runs.sinFacturaSince(windowStart(now, 'hoy')).runs
}

/**
 * Lo mismo, pero de UN proyecto. El tope de sesion del loop es suyo y de nadie
 * mas: chatear o escanear en otro proyecto mientras corre no puede comerselo,
 * y hasta hoy se lo comia. Sin fila para el proyecto es cero gastado, no un
 * hueco: la ausencia de ejecuciones es una medida, no una falta de dato.
 *
 * El tope DIARIO sigue leyendose con `spentToday`, global a proposito: ese es
 * el techo del operador sobre la herramienta entera, no sobre un proyecto.
 */
export function spentTodayByProject(context: AppContext, now: Date, projectId: string): number {
  return context.runs.usageByProjectSince(windowStart(now, 'hoy'))[projectId]?.costUsd ?? 0
}
