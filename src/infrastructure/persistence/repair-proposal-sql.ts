export const COLS = 'id, project_id, finding_id, base_sha, state, analysis_verdict, analysis_reason, created_at, updated_at' // prettier-ignore

/** La propuesta mas reciente de cada hallazgo quedo OBSOLETA bajo ese escaneo. */
export const OBSOLETOS = `SELECT p.finding_id FROM repair_proposals p
  JOIN findings f ON f.id = p.finding_id AND f.scan_id = @scanId
  WHERE p.project_id = @projectId AND p.state = 'CADUCADO'
    AND p.analysis_verdict = 'OBSOLETO'
    AND p.created_at = (SELECT MAX(q.created_at) FROM repair_proposals q
                        WHERE q.finding_id = p.finding_id)`

/**
 * Hallazgos con propuesta viva. Los terminales llegan del dominio y se pasan
 * como parametros: los `?` se generan por CANTIDAD, nunca se concatena valor.
 */
export const liveFindingIds = (terminales: readonly string[]): string =>
  `SELECT DISTINCT finding_id FROM repair_proposals
   WHERE project_id = ? AND state NOT IN (${terminales.map(() => '?').join(', ')})`

/** Las propuestas vivas de todos los proyectos, en orden de nacimiento. */
export const liveProposals = (terminales: readonly string[]): string =>
  `SELECT ${COLS} FROM repair_proposals
   WHERE state NOT IN (${terminales.map(() => '?').join(', ')})
   ORDER BY created_at`

/** R1 (supersede): la ANALIZADO(REAL) mas reciente de un hallazgo manda. */
export const LATEST_ANALYZED_REAL = `SELECT ${COLS} FROM repair_proposals
  WHERE project_id = @projectId AND finding_id = @findingId
    AND state = 'ANALIZADO' AND analysis_verdict = 'REAL'
  ORDER BY created_at DESC LIMIT 1`
