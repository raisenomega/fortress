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
