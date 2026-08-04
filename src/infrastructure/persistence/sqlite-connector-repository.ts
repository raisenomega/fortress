import { BUILTIN_CONNECTORS } from '@domain/connectors/connector-catalog'
import type { ConnectorState } from '@domain/connectors/connector'
import type { ConnectorRepository } from '@domain/connectors/connector-repository'
import { newId, nowIso } from '@domain/shared/id'
import { err, ok } from '@domain/shared/result'
import * as SQL from './connector-sql'
import { toConnector, type ConnectorRow } from './connector-row'
import type { Db } from './database'

export function createSqliteConnectorRepository(db: Db): ConnectorRepository {
  const selectAll = db.prepare(SQL.SELECT_ALL)
  const selectOne = db.prepare(SQL.SELECT_ONE)
  const seed = db.prepare(SQL.SEED_BUILTIN)
  const setEnabled = db.prepare(SQL.SET_ENABLED)
  const insert = db.prepare(SQL.INSERT_CUSTOM)
  const remove = db.prepare(SQL.DELETE_CUSTOM)

  const at = nowIso()
  for (const c of BUILTIN_CONNECTORS) seed.run({ ...c, at })

  const read = (id: string): ConnectorState | null => {
    const row = selectOne.get(id) as ConnectorRow | undefined
    return row ? toConnector(row) : null
  }

  return {
    list: () => (selectAll.all() as ConnectorRow[]).map(toConnector),

    setEnabled: (id, on) => {
      setEnabled.run(on ? 1 : 0, id)
    },

    addCustom: (input) => {
      const name = input.name.trim()
      if (name === '') return err('El conector necesita un nombre')

      const id = newId()
      const description = input.description.trim()
      insert.run({ id, name, description, url: input.url, category: input.category, at: nowIso() })

      const created = read(id)
      return created ? ok(created) : err('No se pudo guardar el conector')
    },

    remove: (id) => {
      const found = read(id)
      if (!found) return err('Ese conector ya no existe')
      if (found.builtin) return err('Los conectores predefinidos no se borran: desactivalos')

      remove.run(id)
      return ok(null)
    }
  }
}
