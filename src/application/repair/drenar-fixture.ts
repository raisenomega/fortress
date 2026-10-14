import { vi } from 'vitest'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'
import type { ChainOutcome } from './motor-chain-outcome'
import * as cadena from './run-motor-chain'
import type { DrenajeDeps } from './drenar-hasta-omega'

/** El libro vacio: ninguna propuesta aporta ficheros, asi que no hay colision.
 *  El cableado lee `eventLog.list` en cada aterrizaje; sin esto reventaria. */
export const CTX = { eventLog: { list: async (): Promise<readonly ProposalEvent[]> => [] } } as unknown as AppContext // prettier-ignore

/** Un evento GENERATE/TRANSITION con sus ficheros, como lo escribe `generateFix`
 *  antes del gate: lo que `expedienteDeTanda` lee en el momento espera-firma. */
const genEvent = (proposalId: string, files: readonly string[]): ProposalEvent => ({ id: `g-${proposalId}`, proposalId, seq: 1, phase: 'GENERATE', eventType: 'TRANSITION', actor: 'motor', ts: 1, evidenceJson: JSON.stringify({ files }) }) // prettier-ignore

/** Un CTX cuyo libro da estos ficheros por propuesta, para probar la senal. */
export const ctxConFicheros = (porId: Record<string, readonly string[]>): AppContext =>
  ({ eventLog: { list: async (id: string): Promise<readonly ProposalEvent[]> => (porId[id] === undefined ? [] : [genEvent(id, porId[id])]) } }) as unknown as AppContext // prettier-ignore
export const VACIO: ChainOutcome = { kind: 'sin-candidato' }
export const espera = (id: string): ChainOutcome => ({ kind: 'espera-firma', proposalId: id, condition: null }) // prettier-ignore

/** El motor doblado: devuelve estas vueltas en orden y luego sin-candidato. */
export function motor(...vueltas: readonly ChainOutcome[]): ReturnType<typeof vi.spyOn> {
  let i = 0
  return vi.spyOn(cadena, 'runMotorChain').mockImplementation(() => {
    const v = vueltas[i] ?? VACIO
    i += 1
    return Promise.resolve({ ok: true, value: v })
  })
}

export const deps = (over: Partial<DrenajeDeps> = {}): DrenajeDeps => ({
  motor: {} as DrenajeDeps['motor'],
  cancelado: () => false,
  gastado: () => 0,
  topeDiario: () => null,
  maxVueltas: 6,
  costCapUsd: 25,
  ...over
})
