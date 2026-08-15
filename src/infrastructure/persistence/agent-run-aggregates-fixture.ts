import { createRunAggregates } from './agent-run-aggregates'
import type { Db } from './database'
import { createMemoryDb, seedProject } from './memory-db'

const INSERT = `INSERT INTO agent_runs
  (id, project_id, agent_id, kind, duration_ms, failed, cost_usd, num_turns, input_tokens, at)
  VALUES (@id, @projectId, @agentId, @kind, @durationMs, @failed, @costUsd, 1, 10, @at)`

export interface Corrida {
  readonly kind?: string
  readonly costUsd?: number
  readonly projectId?: string
  readonly agentId?: string | null
  readonly durationMs?: number
  readonly failed?: number
  readonly at?: string
}

/**
 * Base real con dos proyectos: `p1` y `p2`, para poder separar por proyecto.
 * El segundo va a mano porque `seedProject` fija la ruta y la columna es unica.
 */
export function banco(): { db: Db; agg: ReturnType<typeof createRunAggregates> } {
  const db = createMemoryDb()
  seedProject(db, 'p1')
  db.prepare("INSERT INTO projects (id, name, path, created_at) VALUES ('p2', 'Otro', '/tmp/otro', '2026-08-01T00:00:00Z')").run() // prettier-ignore
  return { db, agg: createRunAggregates(db) }
}

let n = 0

/** Asienta una corrida. Lo que no se diga toma un valor neutro para el agregado. */
export function corrida(db: Db, c: Corrida = {}): void {
  n += 1
  db.prepare(INSERT).run({
    id: `run-${n}`,
    projectId: c.projectId ?? 'p1',
    agentId: c.agentId ?? null,
    kind: c.kind ?? 'chat',
    durationMs: c.durationMs ?? 0,
    failed: c.failed ?? 0,
    costUsd: c.costUsd ?? 0,
    at: c.at ?? '2026-08-15T10:00:00Z'
  })
}

export const AYER = '2026-08-14T10:00:00Z'
export const MEDIANOCHE = '2026-08-15T00:00:00Z'
