import { describe, expect, it } from 'vitest'
import type { Db } from './database'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteProjectRepository } from './sqlite-project-repository'

interface Cruda {
  readonly has_graph: number
  readonly graph_nodes: number | null
  readonly graph_edges: number | null
  readonly graph_indexed_at: string | null
}
const cruda = (db: Db, id: string): Cruda =>
  db.prepare('SELECT has_graph, graph_nodes, graph_edges, graph_indexed_at FROM projects WHERE id = ?').get(id) as Cruda // prettier-ignore

describe('has_graph refleja si el proyecto tiene indice de verdad', () => {
  it('setGraph: 1 con sus stats; clearGraph: 0 y las stats a NULL; y hasGraph lo lee', () => {
    const db = createMemoryDb()
    const id = seedProject(db, 'p1')
    const repo = createSqliteProjectRepository(db)
    expect(repo.findById(id)?.hasGraph).toBe(false)

    repo.setGraph(id, 1232, 2524, '2026-09-24T13:46:31Z')
    expect(repo.findById(id)?.hasGraph).toBe(true)
    expect(cruda(db, id)).toEqual({ has_graph: 1, graph_nodes: 1232, graph_edges: 2524, graph_indexed_at: '2026-09-24T13:46:31Z' }) // prettier-ignore

    repo.clearGraph(id)
    expect(repo.findById(id)?.hasGraph).toBe(false)
    expect(cruda(db, id)).toEqual({ has_graph: 0, graph_nodes: null, graph_edges: null, graph_indexed_at: null }) // prettier-ignore
  })
})
