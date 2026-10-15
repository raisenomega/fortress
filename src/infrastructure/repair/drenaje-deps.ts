import { readLoopBudget } from '@application/settings/read-loop-budget'
import { spentTodayByProject } from '@application/settings/read-budget'
import type { AppContext } from '@application/context'
import type { DrenajeDeps } from '@application/repair/drenaje-types'
import { buildMotorChainDeps } from './motor-chain-deps'
import { isCancelled } from '../run-control'
import { topeDiarioAlcanzado } from '../run-guard'

/**
 * Las deps del drenaje, armadas en UN solo sitio. El handler del renderer y el
 * runner headless las piden por aqui para que los topes —vueltas, gasto de
 * sesion y tope del DIA— sean IDENTICOS por los dos caminos: una sola fuente de
 * verdad evita que un disparador nuevo arme las suyas y se salte uno.
 */
export function construirDepsDelDrenaje(context: AppContext, id: string): DrenajeDeps {
  const budget = readLoopBudget(context)
  const base = spentTodayByProject(context, new Date(), id)
  return {
    motor: buildMotorChainDeps(id),
    cancelado: () => isCancelled(id),
    gastado: () => spentTodayByProject(context, new Date(), id) - base,
    topeDiario: () => topeDiarioAlcanzado(context, new Date()),
    maxVueltas: budget.maxCycles,
    costCapUsd: budget.costCapUsd
  }
}
