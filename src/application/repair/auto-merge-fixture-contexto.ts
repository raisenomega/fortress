import type { NewOmegaEntry } from '@domain/omega/omega-entry'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { Severity } from '@domain/shared/severity'
import type { AppContext } from '../context'
import { cadenaCompleta } from './collect-post-omega-fixture'

export interface OpcionesDelContexto {
  readonly events?: ProposalEvent[]
  readonly severity?: Severity
  /** false = el hallazgo ya no esta en la memoria del proyecto. */
  readonly hallazgo?: boolean
  readonly proyecto?: boolean
  readonly propuesta?: boolean
}

/**
 * El doble del contexto: la propuesta, su proyecto, su hallazgo y los dos
 * libros. Vive aparte del banco de deps porque son dos cosas distintas —lo que
 * el sistema SABE y lo que el sistema PUEDE hacer— y juntas ya no cabian.
 */
export function contextoDePrueba(
  opts: OpcionesDelContexto,
  proposal: Proposal,
  patches: Array<ProposalPatch & { id: string }>,
  entries: NewOmegaEntry[]
): AppContext {
  const hallazgos = opts.hallazgo === false ? [] : [{ id: 'f-1', severity: opts.severity ?? 'LOW' }]
  return {
    projects: { findById: () => (opts.proyecto === false ? null : { id: 'proj', path: '/repo' }) },
    repairProposals: {
      findById: () => (opts.propuesta === false ? null : proposal),
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch })
    },
    findings: { listMemory: () => hallazgos },
    eventLog: {
      list: () => Promise.resolve(opts.events ?? cadenaCompleta()),
      record: (): Promise<void> => Promise.resolve()
    },
    omegaLog: { append: (e: NewOmegaEntry): void => void entries.push(e) }
  } as unknown as AppContext
}
