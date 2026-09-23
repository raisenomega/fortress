/** Las cuatro escrituras y la lectura de `finding_aliases` (ADR-101, palanca 2). */
export const SELECT_ALIAS = `SELECT finding_id FROM finding_aliases WHERE project_id = ? AND clave = ?`

/** INSERT OR REPLACE: la ultima palabra sobre una clave manda. */
export const REGISTRAR_ALIAS = `INSERT OR REPLACE INTO finding_aliases (project_id, clave, finding_id, origen, at)
  VALUES (@projectId, @clave, @findingId, @origen, @at)`

/** Cuando una fila queda absorbida, lo que apuntaba a ella pasa a la ganadora. */
export const REAPUNTAR_ALIAS = `UPDATE finding_aliases SET finding_id = @ganadora
  WHERE project_id = @projectId AND finding_id = @absorbida`

export const BORRAR_ALIAS = `DELETE FROM finding_aliases WHERE project_id = ? AND clave = ?`

/** Lo que el sync necesita saber de la fila a la que lleva un alias. */
export const SELECT_SUPERVIVIENTE = `SELECT id, project_id, identity, extinct_reason FROM findings WHERE id = ?`
