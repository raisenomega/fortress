import type { Proposal, ProposalState } from '@domain/repair/proposal'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'

export interface Marca {
  readonly id: string
  readonly note: string
  readonly at: string
}

export interface BancoDelAvance {
  readonly context: AppContext
  readonly proposal: Proposal
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly marcas: Marca[]
}

export interface OpcionesDelAvance {
  readonly state: ProposalState
  /** Lo que devuelve `markMitigated`: `false` = la fila ya no estaba ACTIVE. */
  readonly marcaEscribe?: boolean
  /** `markMitigated` LANZA. No deberia —es un UPDATE— pero si lo hiciera, una
   *  integracion ya consumada no puede caerse por el apunte. */
  readonly marcaLanza?: boolean
}

/** Una propuesta, 'p-1', sobre el hallazgo 'f-1'. */
export function bancoDelAvance(opts: OpcionesDelAvance): BancoDelAvance {
  const patches: Array<ProposalPatch & { id: string }> = []
  const marcas: Marca[] = []
  const proposal = { id: 'p-1', projectId: 'proj', findingId: 'f-1', baseSha: 'base', state: opts.state, createdAt: 1, updatedAt: 1 } as Proposal // prettier-ignore

  const context = {
    repairProposals: {
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch })
    },
    findings: {
      markMitigated: (id: string, note: string, at: string): boolean => {
        if (opts.marcaLanza === true) throw new Error('la base no responde')
        marcas.push({ id, note, at })
        return opts.marcaEscribe !== false
      }
    },
    eventLog: { record: (): Promise<void> => Promise.resolve() }
  } as unknown as AppContext

  return { context, proposal, patches, marcas }
}
