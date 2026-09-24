import type { GraphState } from '@domain/graph/graph-state'
import type { GraphStats } from '@domain/graph/graph-status'
import type { AppContext } from '../context'
import type { ReconcileDeps, RunnerResult } from './reconcile-graph'

export interface Bench {
  readonly context: AppContext
  readonly deps: ReconcileDeps
  readonly marks: string[]
  readonly notified: string[]
  /** Lo escrito en `has_graph`: `clear` o `set:nodos/aristas@fecha`. */
  readonly grafo: string[]
  /** Ejecuta el trabajo encolado (el reconcilio NUNCA lo espera solo). */
  readonly runQueued: () => Promise<void>
}

interface Opciones {
  readonly state?: Partial<GraphState>
  readonly sha?: string | null
  readonly runnerResult?: RunnerResult
  readonly now?: number
  readonly contaminado?: boolean
  /** Hay un turno corriendo en ese proyecto: su checkpoint se deshara (BUG 4). */
  readonly turnoVivo?: boolean
  /** El indice en disco al mirar (por defecto existe, como en un proyecto sano). */
  readonly indice?: GraphStats | null
  /** El indice en disco DESPUES de que el runner termine (por defecto, el mismo). */
  readonly indiceTrasIndexar?: GraphStats | null
}

const INDICE: GraphStats = { nodes: 10, edges: 20, files: 3, indexedAt: '2026-09-01T00:00:00Z', rootPath: '/repo' } // prettier-ignore

/** Contexto y deps falsos: registran marcas y capturan el trabajo encolado. */
export function bench(opts: Opciones = {}): Bench {
  const marks: string[] = []
  const notified: string[] = []
  const grafo: string[] = []
  let corrido = false
  let queued: (() => Promise<void>) | null = null
  const state: GraphState = {
    indexedSha: null, indexedAt: null, status: 'IDLE', startedAt: null, error: null,
    ...opts.state
  } // prettier-ignore

  const context = {
    projects: {
      findById: (id: string) => (id === 'p1' ? { id, name: 'P1', path: '/repo', contaminated: opts.contaminado === true } : null), // prettier-ignore
      setGraph: (_id: string, n: number, e: number, at: string): void => void grafo.push(`set:${n}/${e}@${at}`), // prettier-ignore
      clearGraph: (): void => void grafo.push('clear')
    },
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
    runner: { run: () => ((corrido = true), Promise.resolve(opts.runnerResult ?? { ok: true, sha: 'b'.repeat(40) })) }, // prettier-ignore
    indice: () => (corrido ? (opts.indiceTrasIndexar === undefined ? (opts.indice ?? INDICE) : opts.indiceTrasIndexar) : (opts.indice === undefined ? INDICE : opts.indice)), // prettier-ignore
    enqueue: (job) => {
      queued = job
      return Promise.resolve()
    },
    notify: (projectId) => void notified.push(projectId),
    // Sin turno vivo salvo que el test lo pida: es el caso normal.
    turnoVivo: () => opts.turnoVivo === true,
    now: () => opts.now ?? 1_000_000
  }

  return { context, deps, marks, notified, grafo, runQueued: () => (queued ? queued() : Promise.resolve()) } // prettier-ignore
}
