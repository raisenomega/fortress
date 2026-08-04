/** SQL de los conectores, aparte del repositorio para no pasar de 75 lineas. */

export const SELECT_ALL = `
  SELECT id, name, url, description, category, enabled, builtin
  FROM connectors
  ORDER BY builtin DESC, name COLLATE NOCASE ASC`

export const SELECT_ONE = `
  SELECT id, name, url, description, category, enabled, builtin
  FROM connectors WHERE id = ?`

/**
 * Refresca el catalogo sin pisar la decision del operador: `enabled` queda
 * fuera del DO UPDATE a proposito. Si se incluyera, cada arranque apagaria
 * los conectores que el operador acababa de encender.
 */
export const SEED_BUILTIN = `
  INSERT INTO connectors (id, name, url, description, category, enabled, builtin, created_at)
  VALUES (@id, @name, @url, @description, @category, 0, 1, @at)
  ON CONFLICT(id) DO UPDATE SET
    name        = excluded.name,
    url         = excluded.url,
    description = excluded.description,
    category    = excluded.category,
    builtin     = 1`

export const INSERT_CUSTOM = `
  INSERT INTO connectors (id, name, url, description, category, enabled, builtin, created_at)
  VALUES (@id, @name, @url, @description, @category, 1, 0, @at)`

export const SET_ENABLED = 'UPDATE connectors SET enabled = ? WHERE id = ?'

/** El AND builtin = 0 es la barrera real: un predefinido nunca se borra. */
export const DELETE_CUSTOM = 'DELETE FROM connectors WHERE id = ? AND builtin = 0'
