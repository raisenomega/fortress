import { endMerge, tryBeginMerge } from '../run-control'
import type { AutoMergeDeps } from '@application/repair/auto-merge-types'
import { readFortressConfig } from '../project/fortress-config'
import { createGitMergeApplier } from './git-merge-applier'
import { ficherosDelDestino, medirArbolIntegrado } from './medir-arbol-integrado'
import { worktreeRoot } from './repair-deps'
import { lineasDeFicheros } from './worktree-file-reader'

/**
 * Deps de la integracion. Se mide sobre el worktree: ahi el fix ya esta puesto,
 * y ahi tambien esta el `node_modules` con el que el gate lo juzgo.
 *
 * El `projectId` baja hasta el spawn de los comandos por lo mismo que en el
 * resto de la cadena: sin dueno, Detener no alcanza a un gate en marcha, y este
 * corre dentro de una firma, con el operador esperando.
 */
export function buildAutoMergeDeps(projectId: string): AutoMergeDeps {
  return {
    mergeApplier: createGitMergeApplier(),
    carril: { tomar: tryBeginMerge, soltar: endMerge },
    readConfig: readFortressConfig,
    lineasDeFicheros: (id, files) => lineasDeFicheros(`${worktreeRoot()}/${id}`, files),
    ficherosDelDestino,
    medirArbolIntegrado: (id, projectPath) =>
      medirArbolIntegrado(projectId, `${worktreeRoot()}/${id}`, projectPath),
    now: Date.now
  }
}
