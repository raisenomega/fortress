import { GRAPH_SERVER } from './herramientas-del-grafo'

/**
 * El grafo del proyecto (MCP codebase-memory) es la memoria que evita releer el
 * codebase a mano. Consultarlo es NO NEGOCIABLE: por eso viaja en CADA spawn de
 * agente, no como un conector opcional que el operador pueda apagar.
 *
 * El vocabulario —que expone el servidor fijado, cuales son de lectura— vive en
 * `herramientas-del-grafo`: aqui solo el servidor y como se inyecta.
 */
export {
  GRAPH_INDEX_TOOL,
  GRAPH_MCP_VERSION,
  GRAPH_READ_TOOLS,
  GRAPH_SERVER,
  HERRAMIENTAS_DEL_SERVIDOR
} from './herramientas-del-grafo'

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
