import type { Db } from './database'

/**
 * Columnas nullables de `projects` anadidas despues del esquema base: stats del
 * grafo + el score integral de 6 dimensiones (global partial + una por dimension).
 * Todas nullables: null = sin dato (sin indexar / sin auditar / dimension sin medir).
 */
const COLUMNS = [
  'graph_nodes INTEGER',
  'graph_edges INTEGER',
  'graph_indexed_at TEXT',
  'quality_partial INTEGER',
  'dim_seguridad INTEGER',
  'dim_correctitud INTEGER',
  'dim_tests INTEGER',
  'dim_mantenibilidad INTEGER',
  'dim_dependencias INTEGER',
  'dim_operacion INTEGER',
  // Circuit breaker (Capa 4): fecha ISO en que una auditoria dejo el proyecto sucio.
  'contaminated_at TEXT',
  'contamination_detail TEXT',
  // Reindexado automatico del grafo (I1.5-a): que SHA quedo indexado y si hay
  // una corrida en marcha. status: IDLE | RUNNING | ERROR.
  'graph_indexed_at_sha TEXT',
  'graph_indexed_at_ts INTEGER',
  "graph_indexing_status TEXT NOT NULL DEFAULT 'IDLE'",
  'graph_indexing_started_at INTEGER',
  'graph_indexing_error TEXT'
]

function has(db: Db, column: string): boolean {
  const rows = db.pragma('table_info(projects)') as { name: string }[]
  return rows.some((row) => row.name === column)
}

/** ALTER aditivo idempotente: anade las que falten. Nombres literales, nunca input. */
export function addProjectColumns(db: Db): void {
  for (const col of COLUMNS) {
    if (!has(db, col.split(' ')[0])) db.exec(`ALTER TABLE projects ADD COLUMN ${col}`)
  }
}
