import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { alinearBandera } from './bandera-del-grafo'
import type { ReconcileDeps } from './reconcile-graph'

/**
 * El trabajo que va a la cola: correr el indexador y asentar lo que paso. Exito
 * SOLO si el indice quedo en disco: un rc=0 sin `.db` seria has_graph=1 sin
 * grafo, la misma mentira que se vino a quitar.
 */
export function trabajoDeReindex(
  context: AppContext,
  project: Project,
  deps: ReconcileDeps
): () => Promise<void> {
  return async () => {
    const result = await deps.runner.run(project.path, project.id)
    const stats = result.ok ? deps.indice(project.path) : null
    if (result.ok && stats !== null) {
      context.graphState.markSuccess(project.id, result.sha, deps.now())
      alinearBandera(context, project, stats)
    } else {
      const error = result.ok ? 'indexado sin indice en disco' : result.error
      context.graphState.markError(project.id, error, deps.now())
    }
    console.info('[graph-reindex]', project.name, result.ok ? `ok @${result.sha.slice(0, 7)}` : `error: ${result.error}`) // prettier-ignore
    deps.notify(project.id)
  }
}
