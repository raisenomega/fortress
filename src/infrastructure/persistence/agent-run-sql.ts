/** Consultas de la tabla agent_runs. Todas parametrizadas, nunca concatenadas. */
const COLUMNS = `id, project_id, agent_id, kind, duration_ms, failed, input_tokens,
  output_tokens, cache_read_tokens, cache_creation_tokens, cost_usd, num_turns, tools, at,
  usage_known, recibo, modelo`

/** COALESCE porque SUM sobre cero filas devuelve NULL, no 0. */
const SUMS = `COALESCE(SUM(input_tokens), 0)          AS input_tokens,
  COALESCE(SUM(output_tokens), 0)         AS output_tokens,
  COALESCE(SUM(cache_read_tokens), 0)     AS cache_read_tokens,
  COALESCE(SUM(cache_creation_tokens), 0) AS cache_creation_tokens,
  COALESCE(SUM(cost_usd), 0)              AS cost_usd,
  COALESCE(SUM(num_turns), 0)             AS num_turns`

/** Un projectId nulo significa "en todos los proyectos". */
const SCOPED = 'agent_id = @agentId AND (@projectId IS NULL OR project_id = @projectId)'

export const INSERT_RUN = `INSERT INTO agent_runs (id, project_id, agent_id, kind,
  duration_ms, failed, input_tokens, output_tokens, cache_read_tokens,
  cache_creation_tokens, cost_usd, num_turns, edits, tools, at, usage_known, recibo, modelo)
  VALUES (@id, @projectId, @agentId, @kind, @durationMs, @failed, @inputTokens,
  @outputTokens, @cacheReadTokens, @cacheCreationTokens, @costUsd, @numTurns,
  @edits, @tools, @at, @usageKnown, @recibo, @modelo)`

export const SELECT_ONE = `SELECT ${COLUMNS} FROM agent_runs WHERE id = ?`

export const SELECT_BY_PROJECT = `SELECT ${COLUMNS} FROM agent_runs
  WHERE project_id = ? ORDER BY at DESC LIMIT ?`

export const SELECT_BY_AGENT = `SELECT ${COLUMNS} FROM agent_runs
  WHERE agent_id = ? ORDER BY at DESC LIMIT ?`

export const TOTALS_FOR_AGENT = `SELECT COUNT(*) AS runs,
  COALESCE(SUM(failed), 0) AS failed, COALESCE(SUM(edits), 0) AS edits,
  ${SUMS}, MAX(at) AS last_at
  FROM agent_runs WHERE ${SCOPED}`

export const LAST_PROJECT_FOR_AGENT = `SELECT project_id FROM agent_runs
  WHERE ${SCOPED} ORDER BY at DESC LIMIT 1`

export const USAGE_SINCE = `SELECT ${SUMS} FROM agent_runs WHERE at >= ?`

export const USAGE_BY_PROJECT_SINCE = `SELECT project_id, ${SUMS}
  FROM agent_runs WHERE at >= ? GROUP BY project_id`

export const RANKING_SINCE = `SELECT agent_id, COUNT(*) AS runs,
  COALESCE(SUM(edits), 0) AS edits
  FROM agent_runs WHERE at >= ? AND agent_id IS NOT NULL
  GROUP BY agent_id ORDER BY runs DESC, edits DESC LIMIT ?`

/** Media por ejecucion correcta: la base de la estimacion de un workflow. */
export const AVERAGE_RUN = `SELECT COUNT(*) AS runs,
  COALESCE(AVG(cost_usd), 0) AS avg_cost, COALESCE(AVG(duration_ms), 0) AS avg_ms
  FROM agent_runs WHERE project_id = ? AND failed = 0`

/**
 * Lo que ocurrio y no se pudo medir, desde una fecha ISO. Las dos cifras son
 * MEDIDAS —cuantas corridas y cuanto tiempo—; el dinero que falta no aparece
 * aqui porque no existe en ningun sitio. Quien ensene un total lo acompana con
 * esto para no dar por completo lo que sabe incompleto.
 *
 * `usage_known = 0` y no `IS NOT 1`: las filas viejas llevan NULL y no se sabe
 * de que lado caen, asi que contarlas seria afirmar algo que nadie comprobo.
 */
export const SIN_FACTURA_SINCE = `SELECT COUNT(*) AS runs,
  COALESCE(SUM(duration_ms), 0) AS duration_ms
  FROM agent_runs WHERE at >= ? AND usage_known = 0`

/** Episodios (ejecuciones reales) y fallos desde una fecha ISO. Un run = un episodio. */
export const EPISODE_TALLY_SINCE = `SELECT COUNT(*) AS episodes,
  COALESCE(SUM(failed), 0) AS failures FROM agent_runs WHERE at >= ?`
