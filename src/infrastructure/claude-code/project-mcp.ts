import { CBM_CACHE_DIR, GRAPH_BIN } from '@domain/connectors/graph-mcp'
import { readFileSync } from 'fs'
import { join } from 'path'

/** Tope de lo que acaba en --mcp-config: un .mcp.json legitimo pesa KBs, no megas. */
const MAX_MCP_JSON = 64 * 1024
// Stdio CERRADO: corre fuera del sandbox con la red entera (ADR-092 par. 3). Solo el
// grafo; otro comando u otra clave de env (NODE_OPTIONS, HTTPS_PROXY...): aqui no se ensancha.
const COMANDOS_STDIO: readonly string[] = [GRAPH_BIN]
const CLAVES_ENV: readonly string[] = [CBM_CACHE_DIR]

/** Forma CERRADA de una entrada: lo unico que viaja (el idioma de buildMcpConfig y GRAPH_MCP). */
export type ProjectMcpServer =
  | {
      readonly type: 'stdio'
      readonly command: string
      readonly args: readonly string[]
      readonly env?: Readonly<Record<string, string>>
    }
  | { readonly type: 'http' | 'sse'; readonly url: string }

export type ProjectMcpServers = Record<string, ProjectMcpServer>

const esObjeto = (valor: unknown): valor is Record<string, unknown> =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor)

const soloCadenas = (valor: unknown): valor is readonly string[] =>
  Array.isArray(valor) && valor.every((item) => typeof item === 'string')

/** Solo pares cadena-cadena de claves admitidas; un env que no sea objeto se anula. */
function envAcotado(valor: unknown): Readonly<Record<string, string>> | undefined {
  if (!esObjeto(valor)) return undefined
  const admitido = (par: [string, unknown]): par is [string, string] =>
    CLAVES_ENV.includes(par[0]) && typeof par[1] === 'string'
  return Object.fromEntries(Object.entries(valor).filter(admitido))
}

/** Proyeccion por la forma cerrada; sin `type` es stdio (mcp add viejo). Lo demas, fuera. */
function entradaAcotada(valor: unknown): ProjectMcpServer | null {
  if (!esObjeto(valor)) return null
  if ((valor.type === 'http' || valor.type === 'sse') && typeof valor.url === 'string')
    return { type: valor.type, url: valor.url }
  if (valor.type !== undefined && valor.type !== 'stdio') return null
  if (typeof valor.command !== 'string' || !COMANDOS_STDIO.includes(valor.command)) return null
  const args = valor.args ?? []
  if (!soloCadenas(args)) return null
  const env = envAcotado(valor.env)
  const base = { type: 'stdio', command: valor.command, args } as const
  return env === undefined ? base : { ...base, env }
}

/**
 * Servidores MCP del `.mcp.json` del proyecto: donde el operador (o `claude
 * mcp add`) dejo el codebase-memory apuntando al graph.db real. Viajan en
 * --mcp-config porque en headless el CLI no auto-aprueba los del disco.
 * SEGURIDAD: un .mcp.json define comandos que se ejecutan. Solo se lee en proyectos
 * de CONFIANZA (ADR-044); la confianza decide SI se lee; la forma y COMANDOS_STDIO
 * acotan QUE viaja. Null si falta, es invalido o nada sobrevive.
 */
export function readProjectMcpServers(projectPath: string): ProjectMcpServers | null {
  try {
    const raw = readFileSync(join(projectPath, '.mcp.json'), 'utf8')
    if (raw.length > MAX_MCP_JSON) return null
    const servers = (JSON.parse(raw) as { mcpServers?: unknown }).mcpServers
    if (!esObjeto(servers)) return null
    const acotados: Record<string, ProjectMcpServer> = {}
    for (const [nombre, cruda] of Object.entries(servers)) {
      const entrada = entradaAcotada(cruda)
      if (entrada !== null) acotados[nombre] = entrada
    }
    return Object.keys(acotados).length > 0 ? acotados : null
  } catch {
    return null
  }
}
