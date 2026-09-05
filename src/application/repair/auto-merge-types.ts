import type { FailedCondition } from '@domain/repair/auto-merge-policy'
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

// La via vive en el dominio: el asiento del Libro tambien la nombra. Se
// reexporta para que quien ya la pedia aqui la siga pidiendo aqui.
export type { ViaDeIntegracion } from '@domain/repair/via-de-integracion'

export interface AutoMergeResult {
  readonly applied: boolean
  /** Por que no se aplico. Ausente cuando se aplico. */
  readonly reason?: string
  readonly mergeCommitSha?: string
  /**
   * La condicion de politica que freno, TIPADA. `reason` la interpola en un
   * texto y ahi deja de ser distinguible; quien decida a partir de ella —el
   * ciclo, contando denegaciones— necesita el valor, no el relato. null cuando
   * no se llego a evaluar la politica o cuando si se integro.
   */
  readonly denial: FailedCondition | null
}

/** El turno del arbol vivo. Puerto porque el mutex vive en infraestructura y la
 *  aplicacion no la importa: lo recibe, como el applier. */
export interface CarrilDeMerge {
  readonly tomar: (projectId: string) => boolean
  readonly soltar: (projectId: string) => void
}

export interface AutoMergeDeps {
  readonly mergeApplier: MergeApplier
  readonly carril: CarrilDeMerge
  /**
   * Lee la configuracion del proyecto auditado. Entra como puerto porque toca
   * disco: la aplicacion no importa infraestructura, la recibe.
   */
  readonly readConfig: (projectPath: string) => ConfigState
  /**
   * Cuantas lineas tendra cada archivo del fix una vez integrado, medidas sobre
   * el worktree que ya lo tiene aplicado. Puerto por lo mismo que el de arriba:
   * contar lineas es leer disco, y la politica que decide con ese numero es
   * pura. Se mide el RESULTADO y no se estima sumando altas menos bajas.
   */
  readonly lineasDeFicheros: (
    proposalId: string,
    files: readonly string[]
  ) => Readonly<Record<string, number>>
  readonly now: () => number
}
