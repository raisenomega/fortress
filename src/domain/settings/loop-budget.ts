/**
 * Topes del loop autonomo: SIN valores por defecto. El operador los fija a mano
 * en Configuracion; hasta que AMBOS esten guardados y sean > 0, el loop no se
 * puede encender (loopConfigured). Es el freno duro contra el gasto en bucle.
 */
export interface LoopBudget {
  /** Tope de gasto acumulado de la sesion de loop, en dolares. */
  readonly costCapUsd: number
  /** Maximo de ciclos por sesion de loop. */
  readonly maxCycles: number
}

function parseAmount(raw: string | null): number {
  if (raw === null) return 0
  const value = Number.parseFloat(raw.replace(',', '.'))
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(value, 1000)
}

function parseCount(raw: string | null): number {
  if (raw === null) return 0
  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value < 0) return 0
  return Math.min(value, 100)
}

/** Lee los topes de settings. Sin fijar -> 0, que loopConfigured trata como no listo. */
export function parseLoopBudget(costCap: string | null, maxCycles: string | null): LoopBudget {
  return { costCapUsd: parseAmount(costCap), maxCycles: parseCount(maxCycles) }
}

/** El loop solo se habilita si AMBOS topes estan fijados y son positivos. */
export function loopConfigured(budget: LoopBudget): boolean {
  return budget.costCapUsd > 0 && budget.maxCycles > 0
}
