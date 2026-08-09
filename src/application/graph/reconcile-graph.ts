import { decideReindex } from '@domain/graph/reindex-decision'
import type { AppContext } from '../context'

export type ReconcileOutcome = 'SKIPPED' | 'STARTED' | 'FAILED_TO_START'

/** Resultado del runner de indexado (infra lo implementa; tests lo fingen). */
export type RunnerResult = { ok: true; sha: string } | { ok: false; error: string }

/** Puertos del reconcilio, inyectados por infra: correr, encolar, avisar. */
export interface ReconcileDeps {
  readonly runner: { run(projectPath: string, projectId: string): Promise<RunnerResult> }
  readonly enqueue: (job: () => Promise<void>) => Promise<void>
  /** Push al renderer: el estado de indexado de ese proyecto cambio. */
  readonly notify: (projectId: string) => void
  readonly now: () => number
}

/**
 * Alinea el grafo con el HEAD vivo SI hace falta, y siempre en background: el
 * caller recibe la decision en cuanto el trabajo queda encolado, nunca espera
 * el indexado. planRepair no conoce esto: C2 sigue vivo-primero de todas formas.
 */
export async function reconcileGraph(
  context: AppContext,
  projectId: string,
  deps: ReconcileDeps
): Promise<ReconcileOutcome> {
  const project = context.projects.findById(projectId)
  if (!project) return 'SKIPPED'
  const currentSha = context.headSha(project.path)
  if (currentSha === null) {
    console.info('[graph-reindex]', project.name, 'SKIP: sin repo git')
    return 'SKIPPED'
  }

  const state = context.graphState.getGraphState(projectId)
  const decision = decideReindex({
    currentSha,
    indexedSha: state.indexedSha,
    status: state.status,
    runningSince: state.startedAt ?? undefined,
    now: deps.now()
  })
  console.info('[graph-reindex]', project.name, decision.action, '—', decision.reason)
  if (decision.action === 'SKIP') return 'SKIPPED'

  try {
    context.graphState.markRunning(projectId, deps.now())
    deps.notify(projectId)
    void deps.enqueue(async () => {
      const result = await deps.runner.run(project.path, projectId)
      if (result.ok) context.graphState.markSuccess(projectId, result.sha, deps.now())
      else context.graphState.markError(projectId, result.error, deps.now())
      console.info('[graph-reindex]', project.name, result.ok ? `ok @${result.sha.slice(0, 7)}` : `error: ${result.error}`) // prettier-ignore
      deps.notify(projectId)
    })
    return 'STARTED'
  } catch (error) {
    const message = error instanceof Error ? error.message : 'fallo al arrancar el reindex'
    context.graphState.markError(projectId, message, deps.now())
    return 'FAILED_TO_START'
  }
}
