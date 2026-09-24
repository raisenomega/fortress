import type { GraphStats } from '@domain/graph/graph-status'
import { decideReindex } from '@domain/graph/reindex-decision'
import type { AppContext } from '../context'
import { alinearBandera } from './bandera-del-grafo'
import { loQueHayQueReconciliar } from './lo-que-hay-que-reconciliar'
import { trabajoDeReindex } from './trabajo-de-reindex'

export type ReconcileOutcome = 'SKIPPED' | 'STARTED' | 'FAILED_TO_START'

/** Resultado del runner de indexado (infra lo implementa; tests lo fingen). */
export type RunnerResult = { ok: true; sha: string } | { ok: false; error: string }

/** Puertos del reconcilio, inyectados por infra: correr, encolar, avisar, mirar el disco. */
export interface ReconcileDeps {
  readonly runner: { run(projectPath: string, projectId: string): Promise<RunnerResult> }
  readonly enqueue: (job: () => Promise<void>) => Promise<void>
  /** Push al renderer: el estado de indexado de ese proyecto cambio. */
  readonly notify: (projectId: string) => void
  /** Si hay un turno vivo en ese proyecto: su checkpoint se deshara (BUG 4). */
  readonly turnoVivo: (projectId: string) => boolean
  /** El indice en la cache del grafo, o null si el `.db` no esta o no se deja leer. */
  readonly indice: (projectPath: string) => GraphStats | null
  readonly now: () => number
}

/**
 * Alinea el grafo con el HEAD vivo SI hace falta, y siempre en background: el
 * caller recibe la decision en cuanto el trabajo queda encolado, nunca espera.
 * `onBoot` lo pone SOLO la reconciliacion del arranque: alli una marca RUNNING
 * es huerfana por definicion y se reclama sin esperar. Antes de decidir mira
 * el disco: `has_graph` se alinea con lo que hay, y un indice ausente se
 * reindexa aunque la contabilidad diga «alineado con HEAD».
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

  const indice = deps.indice(project.path)
  alinearBandera(context, project, indice)
  const state = context.graphState.getGraphState(projectId)
  const decision = decideReindex({
    currentSha,
    indexedSha: state.indexedSha,
    status: state.status,
    runningSince: state.startedAt ?? undefined,
    onBoot,
    turnoVivo: deps.turnoVivo(projectId),
    indiceEnDisco: indice !== null,
    now: deps.now()
  })
  console.info('[graph-reindex]', project.name, decision.action, '—', decision.reason)
  if (decision.action === 'SKIP') return 'SKIPPED'

  try {
    context.graphState.markRunning(projectId, deps.now())
    deps.notify(projectId)
    void deps.enqueue(trabajoDeReindex(context, project, deps))
    return 'STARTED'
  } catch (error) {
    const message = error instanceof Error ? error.message : 'fallo al arrancar el reindex'
    context.graphState.markError(projectId, message, deps.now())
    return 'FAILED_TO_START'
  }
}
