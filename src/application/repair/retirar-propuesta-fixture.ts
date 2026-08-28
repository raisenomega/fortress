import type { NewOmegaEntry } from '@domain/omega/omega-entry'
import type { Proposal, ProposalState } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { AppContext } from '../context'

/** Lo que la retirada escribe, capturado: el parche, el libro y la nota. */
export interface Banco {
  readonly context: AppContext
  readonly parches: object[]
  readonly eventos: ProposalEvent[]
  readonly asientos: NewOmegaEntry[]
}

export const enEstado = (state: ProposalState): Proposal => ({ id: 'p1', projectId: 'proy', findingId: 'hall', baseSha: 'abc', state, createdAt: 1, updatedAt: 1 }) // prettier-ignore

/**
 * El doble NO trae `projects` ni `findings`, y no es un descuido: si el caso de
 * uso los pidiera, reventaria aqui. Es lo que fija el alcance — hay una
 * propuesta viva en la base cuyo proyecto y cuyo hallazgo ya no existen, y es
 * justo la que hoy nadie puede tocar.
 */
export function banco(propuesta: Proposal | null): Banco {
  const parches: object[] = []
  const eventos: ProposalEvent[] = []
  const asientos: NewOmegaEntry[] = []

  const context = {
    repairProposals: {
      findById: () => propuesta,
      update: (_id: string, patch: object): void => void parches.push(patch)
    },
    eventLog: {
      list: () => Promise.resolve([]),
      record: (event: ProposalEvent): Promise<void> => {
        eventos.push(event)
        return Promise.resolve()
      }
    },
    omegaLog: { append: (entry: NewOmegaEntry): void => void asientos.push(entry) }
  } as unknown as AppContext

  return { context, parches, eventos, asientos }
}
