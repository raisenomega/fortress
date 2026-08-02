/** Consultas de la tabla activity. Todas parametrizadas. */
const COLUMNS = 'id, project_id, agent_id, kind, summary, severity, file, line, at'

export const INSERT = `INSERT INTO activity (${COLUMNS}) VALUES (@id, @projectId,
  @agentId, @kind, @summary, @severity, @file, @line, @at)`

/** rowid desempata: un escaneo escribe muchas filas con el mismo instante. */
export const BY_PROJECT = `SELECT ${COLUMNS} FROM activity
  WHERE project_id = ? ORDER BY at DESC, rowid DESC LIMIT ?`

export const BY_AGENT = `SELECT ${COLUMNS} FROM activity
  WHERE agent_id = @agentId AND (@projectId IS NULL OR project_id = @projectId)
  ORDER BY at DESC, rowid DESC LIMIT @limit`

/** DISTINCT: el mismo hallazgo reaparece en cada escaneo y no debe contar dos veces. */
export const REPORTED_FINDINGS = `SELECT DISTINCT severity, summary AS title, file, line
  FROM activity WHERE kind = 'finding' AND agent_id = ? AND project_id = ?`
