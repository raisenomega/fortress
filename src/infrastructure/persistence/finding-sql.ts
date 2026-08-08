/** Consultas de findings y dismissals. Todas parametrizadas. */
const COLUMNS = 'id, project_id, severity, title, file, line, status'

/** Lo urgente arriba, y lo descartado al final: ya no requiere accion. */
const BY_URGENCY = `CASE status WHEN 'open' THEN 0 ELSE 1 END,
  CASE severity WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END,
  file, line`

export const SELECT_BY_PROJECT = `SELECT ${COLUMNS} FROM findings
  WHERE project_id = ? ORDER BY ${BY_URGENCY}`

/**
 * Solo cuenta lo abierto. Un CRITICAL descartado por el operador no puede
 * seguir bloqueando el push: descartar tiene que significar algo.
 */
export const COUNTS_BY_PROJECT = `SELECT project_id, severity, COUNT(*) AS total
  FROM findings WHERE status = 'open' GROUP BY project_id, severity`

/** El expediente completo: lo que la base recuerda, no solo lo que se ve. */
export const SELECT_MEMORY = `SELECT id, identity, severity, title, file, line, status,
  lifecycle, first_seen, last_seen, resolved_at FROM findings
  WHERE project_id = ? ORDER BY ${BY_URGENCY}`

/** La fila que ya representa a este hallazgo, si la hay. Clave estable. */
export const SELECT_BY_IDENTITY = 'SELECT id FROM findings WHERE project_id = ? AND identity = ?'

export const INSERT_FINDING = `INSERT INTO findings
  (id, project_id, severity, title, file, line, fingerprint, identity, status, lifecycle,
   scan_id, created_at, first_seen, last_seen)
  VALUES (@id, @projectId, @severity, @title, @file, @line, @fingerprint, @identity, @status,
  'ACTIVE', @scanId, @at, @at, @at)`

/**
 * Se volvio a ver. Se refresca lo que pudo cambiar sin dejar de ser el mismo
 * hallazgo (la linea se mueve, el modelo reformula el texto) y se sella
 * `last_seen`. `first_seen` NO se toca: es su historia, y reescribirla haria
 * parecer recien nacido a un problema que lleva meses.
 */
export const TOUCH_FINDING = `UPDATE findings SET severity = @severity, title = @title,
  file = @file, line = @line, fingerprint = @fingerprint, scan_id = @scanId,
  last_seen = @at, lifecycle = 'ACTIVE', resolved_at = NULL WHERE id = @id`

export const SELECT_FINDING = `SELECT project_id, fingerprint FROM findings WHERE id = ?`

export const SET_STATUS = 'UPDATE findings SET status = ? WHERE id = ?'

export const INSERT_DISMISSAL = `INSERT OR REPLACE INTO dismissals
  (project_id, fingerprint, at) VALUES (?, ?, ?)`

export const DELETE_DISMISSAL = 'DELETE FROM dismissals WHERE project_id = ? AND fingerprint = ?'

export const SELECT_DISMISSALS = 'SELECT fingerprint FROM dismissals WHERE project_id = ?'
