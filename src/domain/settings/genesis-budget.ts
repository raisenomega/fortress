/**
 * Topes del bucle de genesis: SIN valores por defecto. El operador los fija a
 * mano en Configuracion; hasta que AMBOS esten guardados y sean > 0, el bucle no
 * se puede encender (genesisConfigured). Es el freno duro contra el gasto en bucle.
 */
export interface GenesisBudget {
  /** Tope de gasto acumulado de la sesion de genesis, en dolares. */
  readonly costCapUsd: number
  /** Maximo de episodios por sesion de genesis. */
  readonly maxEpisodes: number
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
  return Math.min(value, 1000)
}

/** Lee los topes de settings. Sin fijar -> 0, que genesisConfigured trata como no listo. */
export function parseGenesisBudget(costCap: string | null, maxEpisodes: string | null): GenesisBudget {
  return { costCapUsd: parseAmount(costCap), maxEpisodes: parseCount(maxEpisodes) }
}

/** El bucle solo se habilita si AMBOS topes estan fijados y son positivos. */
export function genesisConfigured(budget: GenesisBudget): boolean {
  return budget.costCapUsd > 0 && budget.maxEpisodes > 0
}
