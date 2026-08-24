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

/**
 * Por donde entro un fix al repo. Dos vias, y el historial tiene que
 * distinguirlas: la politica integra sola dentro del cerco; la firma la integra
 * un humano que miro el diff. Confundirlas en el mensaje del commit borra la
 * unica diferencia que importa cuando alguien pregunte, dentro de un ano, quien
 * autorizo ese cambio.
 *
 * Viaja como dato explicito y no se deduce de la PolicyEvaluation: casar por el
 * texto de un motivo ata el historial de git a una cadena que alguien puede
 * reescribir sin enterarse de lo que rompe.
 */
export type ViaDeIntegracion = 'automatica' | 'firmada'

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

export interface AutoMergeDeps {
  readonly mergeApplier: MergeApplier
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
