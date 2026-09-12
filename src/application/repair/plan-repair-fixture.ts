import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import { analistaFake } from './plan-repair-analyst-fake'
import { cicloDeVida } from './plan-repair-ciclo-fake'
import type { Bench, Opciones } from './plan-repair-bench-types'

export { hallazgo } from './plan-repair-analyst-fake'
export type { Bench, Opciones } from './plan-repair-bench-types'

/** Contexto falso completo: registra inserciones, patches y eventos. */
export function bench(opts: Opciones): Bench {
  const inserted: Proposal[] = []
  const patches: Array<ProposalPatch & { id: string }> = []
  const events: ProposalEvent[] = []
  const observadas: unknown[] = []
  // Lo que el analista RECIBIO como memoria. El puerto pide `atendidas` desde la
  // Fase 4, y sin esto el bench no podria probar que el motor se la pasa.
  const memoria: Array<readonly string[]> = []
  const anclaDelDescuento: string[] = []
  const extinguidos: Bench['extinguidos'] = []
  const mitigados: Array<{ id: string; note: string; at: string }> = []
  const anotados: Array<{ id: string; note: string }> = []
  const analyst = analistaFake(opts.verdictStatus ?? 'REAL', opts.notes, opts.evidencia)
  const context = {
    projects: { findById: () => ({ id: 'p1', path: '/repo/p1', name: 'Nucleo' }) },
    selfObservations: {
      add: (o: unknown): void => void observadas.push(o),
      listClosed: () => opts.cerradas ?? []
    },
    scans: { listByProject: () => [{ id: 'scan-1' }] },
    ...cicloDeVida(opts, extinguidos, mitigados, anotados),
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
    analystFor: () => ({
      study: (t: unknown, atendidas: readonly string[]) => (memoria.push(atendidas), analyst.study(t as never, atendidas)) // prettier-ignore
    }),
    headSha: () => (opts.sha === undefined ? 'abc1234' : opts.sha),
    fortressConfig: () => opts.cerco ?? { kind: 'not-present' }
  } as unknown as AppContext
  // prettier-ignore
  return { context, inserted, patches, events, observadas, memoria, anclaDelDescuento, extinguidos, mitigados, anotados }
}
