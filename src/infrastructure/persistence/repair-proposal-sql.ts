export const COLS = 'id, project_id, finding_id, base_sha, state, analysis_verdict, analysis_reason, created_at, updated_at' // prettier-ignore

/**
 * La propuesta mas reciente de cada hallazgo quedo OBSOLETA sobre el HEAD que
 * hoy tiene el repo.
 *
 * Antes el descuento se ataba al escaneo vigente (`f.scan_id = @scanId`), y eso
 * dejaba INMUNE a todo hallazgo que sobreviviera en memoria de un escaneo
 * anterior: por muchas veces que se declarase obsoleto, volvia a la cola en el
 * ciclo siguiente y quemaba un analista entero cada vez.
 *
 * El ancla correcta es el arbol, no la corrida del escaner: si el HEAD no se ha
 * movido desde que se dictamino obsoleto, volver a mirarlo daria lo mismo. Y en
 * cuanto el HEAD avanza el descuento se levanta solo, porque el codigo bajo el
 * hallazgo ya no es el que se juzgo. Es una PAUSA reversible, no una exclusion:
 * el mismo trato que da el freno de reintento por scope.
 */
export const OBSOLETOS = `SELECT p.finding_id FROM repair_proposals p
  WHERE p.project_id = @projectId AND p.state = 'CADUCADO'
    AND p.analysis_verdict = 'OBSOLETO'
    AND p.base_sha = @headSha
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
