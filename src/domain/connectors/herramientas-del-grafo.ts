export const GRAPH_SERVER = 'codebase-memory'

/**
 * Version FIJADA que instala la accion "Instalar grafo" (`npm i -g
 * codebase-memory-mcp@VERSION`). Subela a conciencia, revisando el changelog, y
 * vuelve a MEDIR la lista de abajo: `grafo-instalado.test.ts` la cruza con el
 * binario real y cae si no coinciden.
 */
export const GRAPH_MCP_VERSION = '0.9.0'

/**
 * Lo que el servidor de la version fijada EXPONE, medido con `tools/list` por
 * stdio el 2026-09-21. Es la FUENTE DE VERDAD del vocabulario: un prompt solo
 * puede nombrar lo que esta aqui, y `herramientas-del-grafo.test.ts` lo deriva.
 *
 * Aqui vivian cuatro nombres que el servidor no tiene —`list_projects`,
 * `index_status`, `check_index_coverage`, `detect_changes`— escritos a mano
 * contra otra version. El analista los pidio 243 veces (backlog, 6 proyectos)
 * y se le concedian en el allowlist: pre-aprobar una herramienta que no existe.
 */
export const HERRAMIENTAS_DEL_SERVIDOR: readonly string[] = [
  'get_architecture',
  'get_code_snippet',
  'get_graph_schema',
  'index_repository',
  'query_graph',
  'search_code',
  'search_graph',
  'trace_path'
]

/** La UNICA de escritura del servidor fijado: indexar tiene su accion con gate. */
const ESCRIBEN: readonly string[] = ['index_repository']

const conPrefijo = (tool: string): string => `mcp__${GRAPH_SERVER}__${tool}`

/** Herramientas de SOLO LECTURA del grafo, DERIVADAS de lo que el servidor
 *  expone menos las de escritura. Se pre-autorizan en lectura+grafo (que corre
 *  en `--permission-mode default`, porque plan BLOQUEA todo MCP). */
export const GRAPH_READ_TOOLS: readonly string[] = HERRAMIENTAS_DEL_SERVIDOR.filter(
  (t) => !ESCRIBEN.includes(t)
).map(conPrefijo)

/** La de ESCRITURA, y solo para la accion que existe para eso. */
export const GRAPH_INDEX_TOOL = conPrefijo('index_repository')
