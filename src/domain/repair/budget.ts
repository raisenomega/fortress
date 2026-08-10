import type { ProposalEvent } from './proposal-event'

/** R2 — tope duro de tokens por propuesta, sumando TODAS sus corridas. */
export const MAX_TOKENS_PER_PROPOSAL = 2_000_000
/** Lo minimo que una corrida de generador puede necesitar: sin ese margen, ni se spawnea. */
export const MIN_GENERATOR_BUDGET = 200_000

/** Lo ya gastado por la propuesta: suma de AGENT_RUN con coste conocido. */
export function computeSpent(events: readonly ProposalEvent[]): number {
  return events
    .filter((event) => event.eventType === 'AGENT_RUN')
    .reduce((total, event) => total + (event.costTokens ?? 0), 0)
}

/** ANTES de spawnear: debe caber al menos el margen minimo del generador. */
export function canAffordGenerator(spent: number): boolean {
  return spent + MIN_GENERATOR_BUDGET <= MAX_TOKENS_PER_PROPOSAL
}

/** DESPUES de la corrida: con la factura real en la mano. */
export function exceededBudget(spent: number, generatorCost: number): boolean {
  return spent + generatorCost > MAX_TOKENS_PER_PROPOSAL
}
