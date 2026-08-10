import { buildTransitionEvent, type ProposalEvent } from '@domain/repair/proposal-event'
import { buildAgentRunEvent } from '@domain/repair/proposal-event'
import type { OmegaVerdict } from '@domain/repair/omega-verdict'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import type { OmegaAgentResult, OmegaDeps } from './run-omega'

export const APROBADO: OmegaVerdict = {
  resuelve_el_hallazgo: 'SI', respeta_scope: 'SI', respeta_doNotTouch: 'SI',
  calidad_del_diff: 'BUENO', riesgo_residual: 'NINGUNO',
  veredicto_global: 'APROBADO', razon: 'fix minimo y correcto'
} // prettier-ignore

const META = { tokensUsed: 120_000, durationMs: 60_000, startedAt: 1, endedAt: 2 }
const ANALYSIS = {
  target: { id: 'f1', severity: 'LOW', title: 't', file: 'src/a/b.ts', line: 1 },
  status: 'REAL', whatToChange: 'w', where: 'src/a/b.ts',
  patternToCopy: 'p', doNotTouch: 'n', risk: 'bajo', tokensUsed: 1
} // prettier-ignore

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
