import type { Proposal, ProposalState } from '@domain/repair/proposal'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import type { FailFn } from './generate-fail'
import type { Admitted } from './generate-guards'
import type { GenerateDeps, Produced } from './generate-types'

export type { FailFn, GenerateDeps, Produced }

export const PRODUCIDO: Produced = {
  worktreePath: '/tmp/wt',
  allowed: ['src/a.ts'],
  allows: [],
  cost: 10
}

export interface Banco {
  readonly ctx: AppContext
  readonly admitido: Admitted
  readonly deps: GenerateDeps
  readonly fail: FailFn
  /** Escrituras de estado: la prueba central es que en el caso ilegal no hay. */
  readonly patches: ProposalPatch[]
  /** Rechazos pedidos a `fail`: idem, ninguno cuando la transicion no cabe. */
  readonly fallos: string[]
}

/** Banco de `verifyAndCommit` con la propuesta en el estado que se le pida. */
export function banco(state: ProposalState): Banco {
  const patches: ProposalPatch[] = []
  const fallos: string[] = []
  const proposal = { id: 'p-1', projectId: 'proj', findingId: 'f1', baseSha: 'base', state } as Proposal // prettier-ignore

  const ctx = {
    repairProposals: { update: (_id: string, patch: ProposalPatch) => void patches.push(patch) },
    eventLog: { record: () => Promise.resolve(), list: () => Promise.resolve([]) }
  } as unknown as AppContext

  const deps = {
    worktrees: {
      hasChanges: () => Promise.resolve(true),
      changedFiles: () => Promise.resolve(['src/a.ts']),
      commit: () => Promise.resolve({ ok: true as const, sha: 'c'.repeat(40) }),
      diff: () => Promise.resolve({ files: ['src/a.ts'], insertions: 1, deletions: 0 })
    },
    now: () => 1
  } as unknown as GenerateDeps

  const admitido = {
    proposal,
    project: { id: 'proj', path: '/repo', name: 'P' },
    analysis: { target: { title: 't' }, whatToChange: 'w' },
    cursor: { seq: 4 },
    spent: 0
  } as unknown as Admitted

  const fail: FailFn = (reason) => {
    fallos.push(reason)
    return Promise.resolve({ ok: false, reason })
  }

  return { ctx, admitido, deps, fail, patches, fallos }
}
