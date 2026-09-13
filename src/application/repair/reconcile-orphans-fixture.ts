import type { Proposal, ProposalState } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import type { ReconcileDeps } from './reconcile-orphans'

export interface Banco {
  readonly context: AppContext
  readonly deps: ReconcileDeps
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly events: ProposalEvent[]
  /** Hallazgos marcados al integrar. El reconciliador es la TERCERA via que
   *  llega a MERGEADO, y sin esto su marca no se veria (ADR-087). */
  readonly marcas: Array<{ id: string; note: string }>
}

export interface Opciones {
  readonly state: ProposalState
  /** Directorios de worktree presentes en disco (ids de propuesta). */
  readonly dirs?: string[]
  /** commitSha que el libro de vida expone; null = la fase GENERATE no llegó. */
  readonly commitSha?: string | null
  /** null simula un proyecto que ya no esta en la base. */
  readonly repoPath?: string | null
  readonly merged?: boolean
}

/** Una sola propuesta viva, 'p-1', con el entorno controlado alrededor. */
export function banco(opts: Opciones): Banco {
  const patches: Array<ProposalPatch & { id: string }> = []
  const events: ProposalEvent[] = []
  const marcas: Array<{ id: string; note: string }> = []
  const sha = opts.commitSha === undefined ? 'c0ffee' : opts.commitSha
  const libro = sha === null ? [] : [{ seq: 1, evidenceJson: JSON.stringify({ commitSha: sha }) }]
  const proposal = { id: 'p-1', projectId: 'proj', findingId: 'f-1', baseSha: 'base', state: opts.state, createdAt: 1, updatedAt: 1 } as Proposal // prettier-ignore
  const repo = opts.repoPath === undefined ? '/repo/vivo' : opts.repoPath
  const context = {
    projects: { findById: () => (repo === null ? null : { id: 'proj', path: repo }) },
    repairProposals: {
      listLive: () => [proposal],
      update: (id: string, patch: ProposalPatch): void => void patches.push({ id, ...patch })
    },
    findings: {
      markMitigated: (id: string, note: string): boolean => (marcas.push({ id, note }), true)
    },
    eventLog: {
      list: () => Promise.resolve(libro as unknown as ProposalEvent[]),
      record: (event: ProposalEvent): Promise<void> => {
        events.push(event)
        return Promise.resolve()
      }
    }
  } as unknown as AppContext
  const deps: ReconcileDeps = {
    listWorktreeDirs: () => opts.dirs ?? [],
    isMerged: () => opts.merged === true,
    now: () => 42
  }
  return { context, deps, patches, events, marcas }
}
