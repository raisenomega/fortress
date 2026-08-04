import { parseLoopBudget, type LoopBudget } from '@domain/settings/loop-budget'
import { SETTINGS_KEYS } from '@domain/settings/settings-repository'
import type { AppContext } from '../context'

/** Los topes del loop tal como estan guardados. Sin fijar -> 0 (loop no listo). */
export function readLoopBudget(context: AppContext): LoopBudget {
  return parseLoopBudget(
    context.settings.get(SETTINGS_KEYS.loopCostCap),
    context.settings.get(SETTINGS_KEYS.loopMaxCycles)
  )
}
