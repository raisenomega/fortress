import { decideReindex } from '@domain/graph/reindex-decision'
import type { AppContext } from '../context'
import { loQueHayQueReconciliar } from './lo-que-hay-que-reconciliar'

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
 *
 * `onBoot` lo pone SOLO la reconciliacion del arranque, y cambia una cosa: alli
 * una marca RUNNING es huerfana por definicion y se reclama sin esperar. Quien
 * llega por el foco de proyecto o por el chip no lo pasa, porque en pleno vuelo
 * ese RUNNING puede ser una corrida viva de esta misma instancia.
 */
export async function reconcileGraph(
  context: AppContext,
  projectId: string,
  deps: ReconcileDeps,
  onBoot = false
): Promise<ReconcileOutcome> {
  const listo = loQueHayQueReconciliar(context, projectId)
  if (listo === null) return 'SKIPPED'
  const { project, currentSha } = listo

  const state = context.graphState.getGraphState(projectId)
  const decision = decideReindex({
    currentSha,
    indexedSha: state.indexedSha,
    status: state.status,
    runningSince: state.startedAt ?? undefined,
    onBoot,
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
