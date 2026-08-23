import type { TokenUsage } from '@domain/telemetry/token-usage'
import type { ProposalEvent } from './proposal-event'

/** R2 — tope duro de tokens por propuesta, sumando TODAS sus corridas. */
export const MAX_TOKENS_PER_PROPOSAL = 2_000_000
/** Lo minimo que una corrida de generador puede necesitar: sin ese margen, ni se spawnea. */
export const MIN_GENERATOR_BUDGET = 200_000
/** Margen minimo para una corrida de OMEGA (D21). */
export const MIN_OMEGA_BUDGET = 300_000

/**
 * La unidad del tope: TRABAJO, no contexto releido.
 *
 * `cache_read` es el mismo contexto entrando otra vez en cada turno, al decimo
 * del precio del input. Contarlo hacia que el tope midiera "contexto x turnos"
 * en vez de trabajo: de los cuatro rechazos de agosto, entre el 93% y el 96% de
 * lo que reventaba el tope era re-lectura, y los cuatro fixes estaban escritos y
 * dentro de su perimetro cuando se tiraron. Restandola gastaron 128k-213k, un
 * 6-11% del tope.
 *
 * `cache_creation` SI entra: es la primera vez que ese contexto se procesa, y se
 * paga por encima del input. Es trabajo hecho una vez, no relectura.
 *
 * No se pondera la re-lectura por su precio —contarla a una decima parte— a
 * proposito: eso seria una tabla de precios dentro del codigo, que es justo lo
 * que `token-usage.ts` se niega a mantener porque se queda vieja y miente.
 * Excluirla no cuesta precision donde importa: el techo de turnos es el que
 * frena lo que la inflaba.
 */
export function trabajoReal(usage: TokenUsage): number {
  return usage.inputTokens + usage.outputTokens + usage.cacheCreationTokens
}

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
