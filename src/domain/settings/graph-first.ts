import type { AgentId } from '../agent/agent'
import { LO_QUE_EL_GRAFO_NO_VE } from './lo-que-el-grafo-no-ve'

/**
 * Se inyecta en TODO prompt de agente. Usar el grafo (MCP codebase-memory) antes
 * de leer a mano es lo que hace sostenible el gasto. Pero el grafo ahorra
 * distinto segun la tarea: en seguridad, para SALTAR al codigo sensible antes de
 * grepear; en trabajo estructural, para responder "quien llama a que" sin releer
 * el repo. Forzar el grafo donde grep es mejor optimizaria la metrica, no el gasto.
 *
 * Lo que NO se le pide es que INDEXE. Se le pedia —"si es la primera vez, corre
 * index_repository sobre la raiz"— y el precio fue un catalogo inservible: un
 * agente que corre dentro de un worktree de reparacion o de un sandbox de
 * genesis obedecia sobre la carpeta TEMPORAL en la que estaba, y el grafo acabo
 * con decenas de copias efimeras y sin el repo que importa. La indexacion tiene
 * su propia accion con gate (`index-graph`), que es donde debia estar sola.
 *
 * La BASE lleva lo que el grafo NO ve (ADR-104): las tres variantes lo heredan,
 * y un rol que lo olvidara seria una cuarta variante sin medir.
 */
const BASE =
  'GRAFO PRIMERO (no negociable): antes de leer archivos a mano, consulta el ' +
  'grafo del proyecto por el MCP codebase-memory. Si el proyecto no esta indexado, ' +
  'dilo y sigue leyendo a mano: NO lo indexes tu. Abre un archivo entero SOLO si ' +
  'el grafo no responde. ' +
  LO_QUE_EL_GRAFO_NO_VE

/** Chat general y agentes sin rol claro: la guia base con las tres herramientas. */
export const GRAPH_FIRST =
  BASE +
  ' Usa get_architecture para el mapa, search_graph para localizar simbolos y ' +
  'trace_path para ver quien llama a que.'

/** Seguridad: el grafo LOCALIZA el codigo sensible; grep inspecciona el patron. */
export const GRAPH_FIRST_SECURITY =
  BASE +
  ' Empieza por search_graph/search_code para saltar directo al codigo de auth, ' +
  'sesion, configuracion y acceso a datos, en vez de recorrer todo el arbol. Una ' +
  'vez ahi, inspecciona a fondo ese punto.'

/** Estructural: trace_path responde "quien llama / esta muerto" sin releer el repo. */
export const GRAPH_FIRST_STRUCTURAL =
  BASE +
  ' Usa trace_path para saber quien llama a una funcion y si esta muerta, y ' +
  'get_architecture para el mapa, en vez de grepear el repo entero: ahi el grafo ' +
  'te ahorra la mayoria de las lecturas.'

const STRUCTURAL: ReadonlySet<AgentId> = new Set([
  'refactor-cleaner',
  'code-reviewer',
  'code-simplifier',
  'planner',
  'sentinel-omega',
  'tdd-guide'
])

/** La guia del grafo segun el rol del agente: cada uno lo usa donde ahorra. */
export function graphFirstFor(agentId: AgentId): string {
  if (agentId === 'security-reviewer') return GRAPH_FIRST_SECURITY
  if (STRUCTURAL.has(agentId)) return GRAPH_FIRST_STRUCTURAL
  return GRAPH_FIRST
}
