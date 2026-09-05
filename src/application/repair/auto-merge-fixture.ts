import type { NewOmegaEntry } from '@domain/omega/omega-entry'
import type { ConfigState } from '@domain/repair/auto-merge-config'
import type { AutoMergePolicy } from '@domain/repair/auto-merge-policy'
import type { MergeApplyInput, MergeApplyOutcome } from '@domain/repair/merge-applier'
import type { Proposal, ProposalState } from '@domain/repair/proposal'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'
import { bancoDelArbol, type OpcionesDelArbol } from './auto-merge-fixture-arbol'
import { contextoDePrueba, type OpcionesDelContexto } from './auto-merge-fixture-contexto'
import type { AutoMergeDeps } from './auto-merge-types'

export const OK: MergeApplyOutcome = { ok: true, mergeCommitSha: 'merge01', targetBranch: 'main' }

export const POLICY_ON: AutoMergePolicy = {
  enabled: true, severities: ['LOW', 'MEDIUM'], maxDiffLines: 20, maxFiles: 5, blacklist: []
} // prettier-ignore

export const CONFIG_ON: ConfigState = { kind: 'valid', policy: POLICY_ON }

export interface Opciones extends OpcionesDelArbol, OpcionesDelContexto {
  readonly state?: ProposalState
  readonly config?: ConfigState
  readonly outcome?: MergeApplyOutcome
  /** true = otro tiene el turno del arbol vivo. */ readonly carrilOcupado?: boolean
  /** Lineas que tendria cada fichero YA con el fix puesto. Vacio = sin medir. */
  readonly lineas?: Readonly<Record<string, number>>
}

export interface Banco {
  readonly context: AppContext
  readonly deps: AutoMergeDeps
  readonly patches: Array<ProposalPatch & { id: string }>
  readonly entries: NewOmegaEntry[]
  readonly aplicados: MergeApplyInput[]
  /** Los ids cuyo arbol integrado se llego a medir. Vacio = no hizo falta. */
  readonly medidas: string[]
}

/** Una propuesta 'p-1' en OMEGA con su libro completo y el entorno controlado. */
export function banco(opts: Opciones = {}): Banco {
  const patches: Array<ProposalPatch & { id: string }> = []
  const entries: NewOmegaEntry[] = []
  const aplicados: MergeApplyInput[] = []
  const proposal = { id: 'p-1', projectId: 'proj', findingId: 'f-1', baseSha: 'base123', state: opts.state ?? 'OMEGA', createdAt: 1, updatedAt: 1 } as Proposal // prettier-ignore
  const context = contextoDePrueba(opts, proposal, patches, entries)
  const arbol = bancoDelArbol(opts)
  const deps: AutoMergeDeps = {
    ...arbol.deps,
    // prettier-ignore
    mergeApplier: { apply: (input: MergeApplyInput): Promise<MergeApplyOutcome> => (aplicados.push(input), Promise.resolve(opts.outcome ?? OK)) },
    carril: { tomar: () => opts.carrilOcupado !== true, soltar: () => {} },
    readConfig: () => opts.config ?? CONFIG_ON,
    lineasDeFicheros: () => opts.lineas ?? {},
    now: () => 42
  }
  return { context, deps, patches, entries, aplicados, medidas: arbol.medidas }
}
