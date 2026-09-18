/**
 * Las columnas de `agent_runs`, aparte para que la migracion que amplia el CHECK
 * recree la tabla desde ESTA definicion. Dos copias del mismo esquema acabarian
 * divergiendo.
 *
 * `usage_known` vive AQUI desde el segundo recambio (2026-09-11). Estaba fuera
 * a proposito —el recambio copiaba con `INSERT ... SELECT *` y una columna de
 * mas lo rompia— y esa decision hacia el recambio DE UN SOLO USO: bastaba un
 * ALTER posterior para que el siguiente fallara al abrir la app. Se arreglo al
 * reves: el recambio copia por NOMBRE, y esta constante vuelve a ser la unica
 * verdad de como es la tabla.
 *
 * `recibo` es la columna del ADR-093 §3.3: QUE corrio cada herramienta, no solo
 * cual. Va APARTE de `tools` y no dentro, porque `tools` es una lista unida por
 * comas y un comando lleva comas; y es NULLABLE porque `null` significa «de esta
 * corrida no se capturo», que no es lo mismo que «no corrio nada». Vive aqui,
 * en la constante, y no en un ALTER suelto: esa es justo la leccion de arriba.
 *
 * `sistema` es el cuarto `kind`: las corridas de los agentes auxiliares —el
 * juez de aplicabilidad, el build, genesis, los episodios, el borrador y el
 * grafo A/B— que hasta hoy gastaban sin constar. Clase propia y no `chat`
 * porque `averageRun`, `episodeTally` y `tokensPerRun` se calculan por `kind`:
 * meterlas en `chat` habria corrompido las metricas del chat con datos que no
 * son chat, y en silencio.
 */
export const AGENT_RUNS_COLUMNS = `
  id                    TEXT PRIMARY KEY,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  agent_id              TEXT,
  kind                  TEXT NOT NULL CHECK (kind IN ('chat', 'scan', 'repair', 'sistema')),
  duration_ms           INTEGER NOT NULL DEFAULT 0,
  failed                INTEGER NOT NULL DEFAULT 0,
  input_tokens          INTEGER NOT NULL DEFAULT 0,
  output_tokens         INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens     INTEGER NOT NULL DEFAULT 0,
  cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd              REAL    NOT NULL DEFAULT 0,
  num_turns             INTEGER NOT NULL DEFAULT 0,
  edits                 INTEGER NOT NULL DEFAULT 0,
  tools                 TEXT    NOT NULL DEFAULT '',
  at                    TEXT    NOT NULL,
  usage_known           INTEGER,
  recibo                TEXT
`

export const AGENT_RUNS_INDEXES = `
CREATE INDEX IF NOT EXISTS idx_runs_project ON agent_runs (project_id, at);
CREATE INDEX IF NOT EXISTS idx_runs_agent   ON agent_runs (agent_id, at);
`
