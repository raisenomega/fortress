/**
 * El grafo del proyecto (MCP codebase-memory) es la memoria que evita releer el
 * codebase a mano. Consultarlo es NO NEGOCIABLE: por eso viaja en CADA spawn de
 * agente, no como un conector opcional que el operador pueda apagar.
 */
export const GRAPH_SERVER = 'codebase-memory'

/**
 * La UNICA de ESCRITURA, y solo para la accion que existe para eso. Aqui vivia
 * un prefijo que abria el servidor ENTERO —`delete_project` incluida— a todo
 * agente fuera del modo lectura. Nacio de un fallo real: sin regla, en headless
 * el MCP se auto-denegaba. Pero lo arreglaba por exceso.
 */
export const GRAPH_INDEX_TOOL = `mcp__${GRAPH_SERVER}__index_repository`

/**
 * Herramientas de SOLO LECTURA del grafo. Se pre-autorizan en el modo lectura+grafo
 * (que corre en `--permission-mode default`, porque plan BLOQUEA todo MCP). Las de
 * escritura (index_repository, ingest_traces, manage_adr, delete_project) quedan
 * FUERA a proposito: la indexacion tiene su propia accion con gate.
 */
export const GRAPH_READ_TOOLS: readonly string[] = [
  'get_architecture',
  'search_graph',
  'trace_path',
  'search_code',
  'get_code_snippet',
  'query_graph',
  'list_projects',
  'index_status',
  'get_graph_schema',
  // Las dos de FRESCURA, y las pidio el analista veinticinco veces sin saber
  // que existian: `check_index_coverage` dice si el indice cubre un fichero y
  // si va al dia respecto al disco, y `detect_changes` dice que cambio desde
  // una fecha o un ref. Sin ellas, decidir REAL vs OBSOLETO era abrir el
  // fichero a ciegas — y el analista corre SIN Bash, asi que no podia diffear
  // por su cuenta. Leen; no escriben.
  'check_index_coverage',
  'detect_changes'
].map((tool) => `mcp__${GRAPH_SERVER}__${tool}`)

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
