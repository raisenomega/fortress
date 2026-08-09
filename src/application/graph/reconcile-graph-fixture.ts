import type { GraphState } from '@domain/graph/graph-state'
import type { AppContext } from '../context'
import type { ReconcileDeps, RunnerResult } from './reconcile-graph'

export interface Bench {
  readonly context: AppContext
  readonly deps: ReconcileDeps
  readonly marks: string[]
  readonly notified: string[]
  /** Ejecuta el trabajo encolado (el reconcilio NUNCA lo espera solo). */
  readonly runQueued: () => Promise<void>
}

interface Opciones {
  readonly state?: Partial<GraphState>
  readonly sha?: string | null
  readonly runnerResult?: RunnerResult
  readonly now?: number
}

/** Contexto y deps falsos: registran marcas y capturan el trabajo encolado. */
export function bench(opts: Opciones = {}): Bench {
  const marks: string[] = []
  const notified: string[] = []
  let queued: (() => Promise<void>) | null = null
  const state: GraphState = {
    indexedSha: null, indexedAt: null, status: 'IDLE', startedAt: null, error: null,
    ...opts.state
  } // prettier-ignore

  const context = {
    projects: { findById: (id: string) => (id === 'p1' ? { id, name: 'P1', path: '/repo' } : null) }, // prettier-ignore
    headSha: () => (opts.sha === undefined ? 'a'.repeat(40) : opts.sha),
    graphState: {
      getGraphState: () => state,
      markRunning: (): void => void marks.push('running'),
      markSuccess: (_id: string, sha: string): void =>
        void marks.push(`success:${sha.slice(0, 3)}`),
      markError: (_id: string, error: string): void => void marks.push(`error:${error}`)
    }
  } as unknown as AppContext

  const deps: ReconcileDeps = {
    runner: { run: () => Promise.resolve(opts.runnerResult ?? { ok: true, sha: 'b'.repeat(40) }) },
    enqueue: (job) => {
      queued = job
      return Promise.resolve()
    },
    notify: (projectId) => void notified.push(projectId),
    now: () => opts.now ?? 1_000_000
  }

  return { context, deps, marks, notified, runQueued: () => (queued ? queued() : Promise.resolve()) } // prettier-ignore
}
