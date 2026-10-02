import { MOTIVO_HUELLA } from '@domain/repair/motivo-de-la-huella'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'

export interface LoVisto {
  /** La huella de la ULTIMA vuelta, o null si git no se dejo leer. */
  readonly huella: string | null
  /** Las de las vueltas ANTERIORES: con la ultima dentro, cualquier vuelta
   *  parecería repetida y el lazo no daría ni una. */
  readonly anteriores: readonly string[]
  /** Vueltas del generador ya dadas: una por asiento de huella. */
  readonly vueltasDadas: number
  /** Dolares de TODAS las corridas de la propuesta (ADR-110 §5). */
  readonly gastadoUsd: number
}

/** Las huellas asentadas, en orden. Un asiento sin huella legible cuenta como
 *  vuelta —se pago— pero no entra en la comparacion: null no es una huella. */
function huellasDe(events: readonly ProposalEvent[]): { lista: (string | null)[] } {
  const lista = events
    .filter((e) => e.phase === 'GENERATE' && e.eventType === 'DECISION' && e.reason === MOTIVO_HUELLA) // prettier-ignore
    .map((e) => {
      try {
        const raw = JSON.parse(e.evidenceJson ?? '{}') as { huella?: unknown }
        return typeof raw.huella === 'string' && raw.huella !== '' ? raw.huella : null
      } catch {
        return null
      }
    })
  return { lista }
}

/**
 * Lo que el lazo necesita saber de una propuesta, LEIDO DEL LIBRO y no llevado
 * en la mano: la huella de cada vuelta se asienta ya (`MOTIVO_HUELLA`) y los
 * dolares viven en el libro mayor. Buscar por MOTIVO y no por posicion es la
 * leccion de DEUDAS §13, y aqui importa mas que en ningun sitio: con el lazo hay
 * varios asientos del mismo tipo y el orden entre ellos ES el dato.
 */
export async function loQueElLazoVe(ctx: AppContext, proposalId: string): Promise<LoVisto> {
  const events = await ctx.eventLog.list(proposalId)
  const { lista } = huellasDe(events)
  const ids = events
    .filter((e) => e.eventType === 'AGENT_RUN' && e.agentRunId !== undefined)
    .map((e) => e.agentRunId as string)

  return {
    huella: lista.at(-1) ?? null,
    anteriores: lista.slice(0, -1).filter((h): h is string => h !== null),
    vueltasDadas: lista.length,
    gastadoUsd: ctx.runs.costUsdOf(ids)
  }
}
