import {
  CONNECTOR_CATEGORIES,
  type ConnectorCategory,
  type ConnectorState
} from '@domain/connectors/connector'

export interface ConnectorRow {
  readonly id: string
  readonly name: string
  readonly url: string
  readonly description: string
  readonly category: string
  readonly enabled: number
  readonly builtin: number
}

const KNOWN = new Set<string>(CONNECTOR_CATEGORIES)

/**
 * SQLite no tiene enums ni booleanos: una base vieja o tocada a mano puede
 * traer una categoria que ya no existe. Se degrada a 'desarrollo' en vez de
 * devolver un ConnectorState que miente sobre su tipo.
 */
function toCategory(raw: string): ConnectorCategory {
  return KNOWN.has(raw) ? (raw as ConnectorCategory) : 'desarrollo'
}

export function toConnector(row: ConnectorRow): ConnectorState {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    description: row.description,
    category: toCategory(row.category),
    enabled: row.enabled === 1,
    builtin: row.builtin === 1
  }
}
