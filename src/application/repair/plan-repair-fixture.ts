import type { FindingMemory } from '@domain/project/finding-memory'
import type { SelfNoteDraft } from '@domain/system/self-observation'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import { analistaFake } from './plan-repair-analyst-fake'

export { hallazgo } from './plan-repair-analyst-fake'

export interface Bench {
  readonly context: AppContext
  readonly inserted: Proposal[]
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly events: ProposalEvent[]
  /** Auto-observaciones asentadas durante la corrida. */
  readonly observadas: unknown[]
}

interface Opciones {
  readonly findings: readonly FindingMemory[]
  /** Lo que el analista fake respondera como `status` (REAL / OBSOLETO). */
  readonly verdictStatus?: string
  readonly obsoleteIds?: readonly string[]
  readonly liveIds?: readonly string[]
  /** Propuestas ya existentes del proyecto, de la mas reciente a la mas vieja. */
  readonly proposals?: readonly Proposal[]
  /** HEAD del repo; null simula un proyecto sin git. */
  readonly sha?: string | null
  /** true: el libro de vida LANZA al asentar (probar que no revierte nada). */
  readonly eventLogThrows?: boolean
  /** Lo que el analista fake devolvera en `notes` (sus apuntes sobre FORTRESS). */
  readonly notes?: readonly SelfNoteDraft[]
}

/** Contexto falso completo: registra inserciones, patches y eventos. */
export function bench(opts: Opciones): Bench {
  const inserted: Proposal[] = []
  const patches: Array<ProposalPatch & { id: string }> = []
  const events: ProposalEvent[] = []
  const observadas: unknown[] = []
  const analyst = analistaFake(opts.verdictStatus ?? 'REAL', opts.notes)
  const context = {
    projects: { findById: () => ({ id: 'p1', path: '/repo/p1', name: 'Nucleo' }) },
    selfObservations: { add: (o: unknown): void => void observadas.push(o) },
    scans: { listByProject: () => [{ id: 'scan-1' }] },
    findings: { listMemory: () => opts.findings },
    repairProposals: {
      insert: (p: Proposal): void => void inserted.push(p),
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch }),
      findObsoleteFindingIds: () => opts.obsoleteIds ?? [],
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
    analystFor: () => analyst,
    headSha: () => (opts.sha === undefined ? 'abc1234' : opts.sha)
  } as unknown as AppContext
  return { context, inserted, patches, events, observadas }
}
