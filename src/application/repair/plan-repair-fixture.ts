import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import { analistaFake } from './plan-repair-analyst-fake'
import type { Bench, Opciones } from './plan-repair-bench-types'

export { hallazgo } from './plan-repair-analyst-fake'
export type { Bench, Opciones } from './plan-repair-bench-types'

/** Contexto falso completo: registra inserciones, patches y eventos. */
export function bench(opts: Opciones): Bench {
  const inserted: Proposal[] = []
  const patches: Array<ProposalPatch & { id: string }> = []
  const events: ProposalEvent[] = []
  const observadas: unknown[] = []
  const anclaDelDescuento: string[] = []
  const extinguidos: Array<{ ids: readonly string[]; at: string; motivo: string }> = []
  const analyst = analistaFake(opts.verdictStatus ?? 'REAL', opts.notes)
  const context = {
    projects: { findById: () => ({ id: 'p1', path: '/repo/p1', name: 'Nucleo' }) },
    selfObservations: { add: (o: unknown): void => void observadas.push(o) },
    scans: { listByProject: () => [{ id: 'scan-1' }] },
    findings: {
      listMemory: () => opts.findings,
      markExtinct: (ids: readonly string[], at: string, motivo: string): void =>
        void extinguidos.push({ ids, at, motivo })
    },
    repairProposals: {
      insert: (p: Proposal): void => void inserted.push(p),
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch }),
      // prettier-ignore
      findObsoleteFindingIds: (_p: string, ancla: string) => (anclaDelDescuento.push(ancla), opts.obsoleteIds ?? []),
      findLiveFindingIds: () => opts.liveIds ?? [],
      findById: () => null,
      listByProject: () => opts.proposals ?? []
    },
    eventLog: {
      record: (event: ProposalEvent): Promise<void> => {
        if (opts.eventLogThrows) return Promise.reject(new Error('libro roto'))
        events.push(event)
        return Promise.resolve()
      },
      list: () => Promise.resolve(events)
    },
    // Como el repositorio real: devuelve la fila con su id, que es lo que el
    // asiento del analista cita para poder cruzarse con el libro mayor.
    runs: { record: (r: object) => ({ ...r, id: 'run-1', at: '' }) },
    analystFor: () => analyst,
    headSha: () => (opts.sha === undefined ? 'abc1234' : opts.sha),
    fortressConfig: () => opts.cerco ?? { kind: 'not-present' }
  } as unknown as AppContext
  return { context, inserted, patches, events, observadas, anclaDelDescuento, extinguidos }
}
