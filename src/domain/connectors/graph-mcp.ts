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

/**
 * Version FIJADA que instala la accion "Instalar grafo" (`npm i -g
 * codebase-memory-mcp@VERSION`). Subela a conciencia, revisando el changelog.
 */
export const GRAPH_MCP_VERSION = '0.9.0'

/** Binario del grafo, ya instalado y en PATH (via la accion Instalar grafo). */
export const GRAPH_BIN = 'codebase-memory-mcp'

/**
 * Servidor stdio del grafo. Apunta al BINARIO instalado, NO a `npx`: en headless,
 * el spawn de `npx` dentro de `--mcp-config` falla el handshake MCP y el servidor
 * queda "failed" con CERO herramientas (era el bug del circuito de tokens). El
 * binario en PATH conecta al instante — verificado con el evento init de claude -p.
 */
const GRAPH_MCP = { type: 'stdio', command: GRAPH_BIN, args: [] } as const

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
  // El grafo sintetizado (npx pineado) es el FALLBACK: si la config ya trae un
  // codebase-memory —el del .mcp.json del proyecto, que apunta a su graph.db
  // real— ese gana. Antes se pisaba siempre, y el grafo indexado no se usaba.
  const mcpServers = { [GRAPH_SERVER]: GRAPH_MCP, ...(base.mcpServers ?? {}) }
  return JSON.stringify({ ...base, mcpServers })
}
