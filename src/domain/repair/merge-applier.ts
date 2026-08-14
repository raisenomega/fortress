/**
 * Puerto de integracion de un fix aprobado al arbol vivo del proyecto. Doctrina
 * heredada de GitPusher: el puerto no decide, solo ejecuta; si se integra o no
 * lo decide el caso de uso.
 *
 * Contrato propio, mas estricto que el del push: cuando el merge NO llega a
 * aplicarse, el arbol de trabajo queda exactamente como estaba. Un merge a
 * medias contradiria al asiento que lo niega, y el operador se encontraria su
 * repo intervenido por una decision que el sistema ya concluyo que no tomaba.
 */
export interface MergeApplier {
  apply(input: MergeApplyInput): Promise<MergeApplyOutcome>
}

export interface MergeApplyInput {
  readonly projectPath: string
  /** Leida del libro, no reconstruida desde el patron de nombres. */
  readonly sourceBranch: string
  readonly commitMessage: string
}

/**
 * Union propia en vez del `Result<T>` del proyecto: el motor tiene que
 * DISTINGUIR los fallos —un conflicto y un arbol sucio piden cosas distintas
 * del operador— y aquel lleva el error como texto plano, sin forma que ramificar.
 *
 * Los tres primeros fallos garantizan que nada quedo escrito. `unknown` es el
 * cajon de lo que no se supo clasificar y NO lo garantiza: por eso se trata
 * como el peor caso y su salida de git se asienta entera.
 */
export type MergeApplyOutcome =
  | { readonly ok: true; readonly mergeCommitSha: string; readonly targetBranch: string }
  | { readonly ok: false; readonly kind: 'target-branch-detached' }
  | { readonly ok: false; readonly kind: 'conflict'; readonly gitOutput: string }
  | { readonly ok: false; readonly kind: 'dirty-tree'; readonly gitOutput: string }
  | { readonly ok: false; readonly kind: 'unknown'; readonly gitOutput: string }

export type MergeFailureKind = Exclude<MergeApplyOutcome, { ok: true }>['kind']
