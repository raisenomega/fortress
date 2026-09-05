import type { NewOmegaEntry } from '@domain/omega/omega-entry'
import type { ConfigState } from '@domain/repair/auto-merge-config'
import type { AutoMergePolicy } from '@domain/repair/auto-merge-policy'
import type { MergeApplyInput, MergeApplyOutcome } from '@domain/repair/merge-applier'
import type { Proposal, ProposalState } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { Severity } from '@domain/shared/severity'
import type { AppContext } from '../context'
import type { AutoMergeDeps } from './auto-merge-types'
import { cadenaCompleta } from './collect-post-omega-fixture'

export const OK: MergeApplyOutcome = { ok: true, mergeCommitSha: 'merge01', targetBranch: 'main' }

export const POLICY_ON: AutoMergePolicy = {
  enabled: true, severities: ['LOW', 'MEDIUM'], maxDiffLines: 20, maxFiles: 5, blacklist: []
} // prettier-ignore

export const CONFIG_ON: ConfigState = { kind: 'valid', policy: POLICY_ON }

export interface Opciones {
  readonly state?: ProposalState
  readonly events?: ProposalEvent[]
  readonly config?: ConfigState
  readonly outcome?: MergeApplyOutcome
  /** true = otro tiene el turno del arbol vivo. */ readonly carrilOcupado?: boolean
  readonly severity?: Severity
  /** false = el hallazgo ya no esta en la memoria del proyecto. */
  readonly hallazgo?: boolean
  readonly proyecto?: boolean
  readonly propuesta?: boolean
  /** Lineas que tendria cada fichero YA con el fix puesto. Vacio = sin medir. */
  readonly lineas?: Readonly<Record<string, number>>
}

export interface Banco {
  readonly context: AppContext
  readonly deps: AutoMergeDeps
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly entries: NewOmegaEntry[]
  readonly aplicados: MergeApplyInput[]
}

/** Una propuesta 'p-1' en OMEGA con su libro completo y el entorno controlado. */
export function banco(opts: Opciones = {}): Banco {
  const patches: Array<ProposalPatch & { id: string }> = []
  const entries: NewOmegaEntry[] = []
  const aplicados: MergeApplyInput[] = []
  const proposal = { id: 'p-1', projectId: 'proj', findingId: 'f-1', baseSha: 'base123', state: opts.state ?? 'OMEGA', createdAt: 1, updatedAt: 1 } as Proposal // prettier-ignore
  const hallazgos = opts.hallazgo === false ? [] : [{ id: 'f-1', severity: opts.severity ?? 'LOW' }]
  const context = {
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
  const deps: AutoMergeDeps = {
    // prettier-ignore
    mergeApplier: { apply: (input: MergeApplyInput): Promise<MergeApplyOutcome> => (aplicados.push(input), Promise.resolve(opts.outcome ?? OK)) },
    carril: { tomar: () => opts.carrilOcupado !== true, soltar: () => {} },
    readConfig: () => opts.config ?? CONFIG_ON,
    lineasDeFicheros: () => opts.lineas ?? {}, now: () => 42
  }
  return { context, deps, patches, entries, aplicados }
}
