import { activeConnectors, type ConnectorState } from './connector'

/** Flag del CLI de Claude que recibe la configuracion MCP en linea. */
export const MCP_CONFIG_FLAG = '--mcp-config'

interface McpServer {
  readonly type: 'http'
  readonly url: string
}

/**
 * Configuracion MCP para Claude Code a partir de los conectores encendidos.
 *
 * Devuelve null si no hay ninguno activo con endpoint: asi quien la usa puede
 * omitir el flag entero y los argumentos quedan exactamente como estaban.
 * Un `--mcp-config {}` no es equivalente a no pasar nada.
 *
 * Solo viajan los que tienen url: los "via CLI" no se configuran por aqui.
 */
export function buildMcpConfig(all: readonly ConnectorState[]): string | null {
  const active = activeConnectors(all)
  if (active.length === 0) return null

  const mcpServers: Record<string, McpServer> = {}
  for (const connector of active) {
    mcpServers[connector.id] = { type: 'http', url: connector.url }
  }

  return JSON.stringify({ mcpServers })
}

/**
 * Suma los servidores MCP del proyecto (su `.mcp.json`) debajo de los conectores.
 * Los conectores del operador GANAN ante claves iguales: un `.mcp.json` no puede
 * suplantar un conector encendido con un servidor propio mientras la UI lo
 * muestra activo. Antes ganaba el proyecto "porque su codebase-memory apunta al
 * graph.db real"; esa razon caduco con la enmienda de ADR-095: hoy `withGraph`
 * decide esa clave en sus dos caminos. Devuelve el JSON base intacto si no hay
 * servidores extra, para no alterar el caso sin proyecto.
 */
export function mergeMcpConfig(
  baseJson: string | null,
  extra: Record<string, unknown> | null
): string | null {
  if (!extra || Object.keys(extra).length === 0) return baseJson
  const base = baseJson ? (JSON.parse(baseJson) as { mcpServers?: Record<string, unknown> }) : {}
  return JSON.stringify({ ...base, mcpServers: { ...extra, ...(base.mcpServers ?? {}) } })
}
