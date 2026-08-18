import { buildTransitionEvent, type ProposalEvent } from '@domain/repair/proposal-event'
import { buildAgentRunEvent } from '@domain/repair/proposal-event'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import { APROBADO, ANALYSIS, META } from './run-omega-datos-fixture'
import type { AppContext } from '../context'
import type { OmegaAgentResult, OmegaDeps } from './run-omega'

export interface Opciones {
  readonly state?: Proposal['state']
  readonly result?: OmegaAgentResult
  readonly spentPrevio?: number
  readonly worktreeExists?: boolean
  readonly clean?: boolean
}

export interface Bench {
  readonly context: AppContext
  readonly deps: OmegaDeps
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly events: ProposalEvent[]
  readonly calls: string[]
}

export function bench(opts: Opciones = {}): Bench {
  const patches: Array<ProposalPatch & { id: string }> = []
  const events: ProposalEvent[] = []
  const calls: string[] = []
  const proposal: Proposal = { id: 'prop-1', projectId: 'p1', findingId: 'f1', baseSha: 'base', state: opts.state ?? 'GATE', analysisVerdict: 'REAL', createdAt: 1, updatedAt: 1 } // prettier-ignore
  const chain: ProposalEvent[] = [
    buildAgentRunEvent({ proposalId: 'prop-1', seq: 1, phase: 'ANALYZE', actor: 'claude-analyst', costTokens: opts.spentPrevio ?? 1000, ts: 1 }), // prettier-ignore
    buildTransitionEvent({ proposalId: 'prop-1', seq: 2, phase: 'ANALYZE', toState: 'ANALIZADO', evidenceJson: JSON.stringify(ANALYSIS), ts: 2 }) // prettier-ignore
  ]
  const context = {
    repairProposals: {
      findById: (id: string) => (id === 'prop-1' ? proposal : null),
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch })
    },
    // Como el real: la fila vuelve con su id, que es lo que el asiento cita.
    runs: { record: (r: object) => ({ ...r, id: 'run-omega', at: '' }) },
    eventLog: {
      list: () => Promise.resolve([...chain, ...events]),
      record: (event: ProposalEvent): Promise<void> => (events.push(event), Promise.resolve())
    }
  } as unknown as AppContext
  const deps: OmegaDeps = {
    worktreeRoot: '/tmp/wt-root',
    worktreeExists: () => opts.worktreeExists ?? true,
    isClean: () => Promise.resolve(opts.clean ?? true),
    changedFiles: () => Promise.resolve(['src/a/b.ts']),
    diffText: () => Promise.resolve('diff --git ...'),
    readPost: () => 'post',
    readPre: () => Promise.resolve('pre'),
    omega: {
      run: () => {
        calls.push('omega')
        return Promise.resolve(opts.result ?? { ok: true, verdict: APROBADO, runMeta: META })
      }
    },
    enqueue: (job) => job(),
    now: () => 9
  }
  return { context, deps, patches, events, calls }
}

export { APROBADO }
