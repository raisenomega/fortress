/**
 * Un conector es un servidor MCP que despues se le pasa a Claude Code. El
 * dominio solo describe que es; quien lo guarda (SQLite) y quien lo enchufa
 * (claude-cli) viven fuera.
 */
export const CONNECTOR_CATEGORIES = [
  'diseno',
  'desarrollo',
  'datos',
  'productividad',
  'observabilidad'
] as const

export type ConnectorCategory = (typeof CONNECTOR_CATEGORIES)[number]

export const CATEGORY_LABEL: Readonly<Record<ConnectorCategory, string>> = {
  diseno: 'Diseno',
  desarrollo: 'Desarrollo',
  datos: 'Datos',
  productividad: 'Productividad',
  observabilidad: 'Observabilidad'
}

export interface Connector {
  readonly id: string
  readonly name: string
  /** Endpoint MCP remoto. Vacio = se conecta por CLI, no por URL. */
  readonly url: string
  readonly description: string
  readonly category: ConnectorCategory
  /** Predefinido del catalogo: se activa y desactiva, pero no se borra. */
  readonly builtin: boolean
}

/** El conector tal y como esta guardado: catalogo + decision del operador. */
export interface ConnectorState extends Connector {
  readonly enabled: boolean
}

/**
 * Verde solo si esta activo Y tiene endpoint. Un conector "via CLI" sin url no
 * se puede pasar en --mcp-config, asi que pintarlo de verde seria mentir.
 */
export function isConnected(connector: ConnectorState): boolean {
  return connector.enabled && connector.url !== ''
}

/** Los que de verdad viajan a Claude Code. */
export function activeConnectors(all: readonly ConnectorState[]): readonly ConnectorState[] {
  return all.filter(isConnected)
}
