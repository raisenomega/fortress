import type { MergeApplier, MergeApplyOutcome } from '@domain/repair/merge-applier'
import { git } from './git-del-merge'

/** Lo que git dijo, traducido a lo que el operador tiene que hacer distinto. */
function clasificar(salida: string): 'conflict' | 'dirty-tree' | 'unknown' {
  if (/CONFLICT|Merge conflict/i.test(salida)) return 'conflict'
  if (/commit your changes|uncommitted|local changes/i.test(salida)) return 'dirty-tree'
  return 'unknown'
}

/**
 * Integra la rama del fix en la rama viva del proyecto. La rama destino se
 * RESUELVE, no se asume: el proyecto puede no llamarla main.
 *
 * Un merge que falla por conflicto deja el repo a medias —MERGE_HEAD escrito,
 * indice en conflicto, marcadores en los archivos—, asi que el abort no es una
 * cortesia: sin el, el motor dejaria intervenido el arbol del operador
 * justo cuando acaba de decidir que no lo tocaba.
 */
export function createGitMergeApplier(): MergeApplier {
  return {
    apply: async ({ projectPath, sourceBranch, commitMessage }): Promise<MergeApplyOutcome> => {
      const head = await git(projectPath, ['rev-parse', '--abbrev-ref', 'HEAD'])
      const targetBranch = head.salida
      if (head.fallo || targetBranch === '' || targetBranch === 'HEAD') {
        return { ok: false, kind: 'target-branch-detached', gitOutput: head.salida }
      }

      const merge = await git(projectPath, ['merge', '--no-ff', sourceBranch, '-m', commitMessage])
      if (merge.fallo) {
        // Restaurar ANTES de clasificar. Si no habia merge que abortar, git
        // protesta y da igual: lo que importa es que el arbol quede limpio.
        await git(projectPath, ['merge', '--abort'])
        return { ok: false, kind: clasificar(merge.salida), gitOutput: merge.salida }
      }

      const sha = await git(projectPath, ['rev-parse', 'HEAD'])
      if (sha.fallo || sha.salida === '') {
        return { ok: false, kind: 'unknown', gitOutput: sha.salida }
      }
      return { ok: true, mergeCommitSha: sha.salida, targetBranch }
    }
  }
}
