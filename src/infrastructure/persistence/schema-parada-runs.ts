/**
 * La corrida de UNA parada del recorrido (ADR-082). Tabla APARTE de
 * `agent_runs`, y es la decision que hace barato esto: alli cuatro consultas
 * CUENTAN filas —`totalsFor`, `averageRun`, `episodeTally`, `sinFactura`— y de
 * ellas cuelgan el `compliance` del superdashboard y el score de OMEGA sobre el
 * escaner. Meter doce filas por escaneo habria dividido `tokensPerRun` entre
 * doce y movido el score sin que nadie tocara el escaner.
 *
 * Son dos preguntas distintas y por eso dos tablas: `agent_runs` contesta
 * «cuantas corridas hubo y cuanto costaron», y esta contesta «como se comporto
 * el agente PARADA A PARADA dentro de una». El gasto diario sigue saliendo solo
 * de `agent_runs`, asi que esta tabla no puede contarlo dos veces.
 */
export const PARADA_RUNS_SCHEMA = `
CREATE TABLE IF NOT EXISTS scan_parada_runs (
  id                    TEXT PRIMARY KEY,
  scan_id               TEXT NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  project_id            TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parada_indice         INTEGER NOT NULL,
  parada_rotulo         TEXT    NOT NULL,
  duration_ms           INTEGER NOT NULL DEFAULT 0,
  input_tokens          INTEGER NOT NULL DEFAULT 0,
  output_tokens         INTEGER NOT NULL DEFAULT 0,
  cache_read_tokens     INTEGER NOT NULL DEFAULT 0,
  cache_creation_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd              REAL    NOT NULL DEFAULT 0,
  num_turns             INTEGER NOT NULL DEFAULT 0,
  at                    TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_parada_runs_scan
  ON scan_parada_runs (scan_id, parada_indice);
`
