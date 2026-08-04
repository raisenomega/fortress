/**
 * El grafo del proyecto (MCP codebase-memory) es la memoria que evita releer el
 * codebase a mano. Consultarlo es NO NEGOCIABLE: por eso viaja en CADA spawn de
 * agente, no como un conector opcional que el operador pueda apagar.
 */
export const GRAPH_SERVER = 'codebase-memory'

/**
 * Regla de --allowedTools que habilita TODAS las herramientas del grafo. Sin
 * ella, en plan headless la llamada al MCP se auto-deniega y el agente cae a
 * Bash: ese era el fallo que dejaba GRAFO PRIMERO como letra muerta.
 */
export const GRAPH_TOOL_RULE = `mcp__${GRAPH_SERVER}`

/** Servidor stdio del grafo, igual que `claude mcp add codebase-memory`. */
const GRAPH_MCP = { command: 'npx', args: ['-y', 'codebase-memory-mcp'] } as const

interface McpConfigShape {
  readonly mcpServers?: Record<string, unknown>
}

/**
 * Inyecta el grafo en la config MCP que ya traian los conectores (o crea una
 * nueva si no habia). SIEMPRE devuelve config: el grafo nunca es opcional. Si el
 * servidor no arranca, Claude Code sigue sin el, como hoy: no rompe el escaneo.
 */
export function withGraph(connectorsJson: string | null): string {
  const base: McpConfigShape = connectorsJson ? (JSON.parse(connectorsJson) as McpConfigShape) : {}
  const mcpServers = { ...(base.mcpServers ?? {}), [GRAPH_SERVER]: GRAPH_MCP }
  return JSON.stringify({ ...base, mcpServers })
}
