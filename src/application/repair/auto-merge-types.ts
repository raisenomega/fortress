import type { ConfigState } from '@domain/repair/auto-merge-config'
import type { MergeApplier } from '@domain/repair/merge-applier'

/**
 * Un id y nada mas. proposalId, projectId y projectPath pasados por separado
 * pueden no corresponderse entre si, y el motor mergearia en el repo
 * equivocado sin forma de notarlo; derivarlos hace imposible esa incoherencia.
 */
export interface AutoMergeInput {
  readonly proposalId: string
}

export interface AutoMergeResult {
  readonly applied: boolean
  /** Por que no se aplico. Ausente cuando se aplico. */
  readonly reason?: string
  readonly mergeCommitSha?: string
}

export interface AutoMergeDeps {
  readonly mergeApplier: MergeApplier
  /**
   * Lee la configuracion del proyecto auditado. Entra como puerto porque toca
   * disco: la aplicacion no importa infraestructura, la recibe.
   */
  readonly readConfig: (projectPath: string) => ConfigState
  readonly now: () => number
}
