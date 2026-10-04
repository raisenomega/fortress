import { readFileSync } from 'fs'
import { join } from 'path'

/** Tope de lo que acaba en --mcp-config: un .mcp.json legitimo pesa KBs, no megas. */
const MAX_MCP_JSON = 64 * 1024

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

/** Solo pares cadena-cadena; un env que no sea objeto se anula entero. */
function envAcotado(valor: unknown): Readonly<Record<string, string>> | undefined {
  if (!esObjeto(valor)) return undefined
  return Object.fromEntries(
    Object.entries(valor).filter((par): par is [string, string] => typeof par[1] === 'string')
  )
}

/**
 * La proyeccion por la forma cerrada; el `type` ausente es stdio (asi lo
 * dejan los `claude mcp add` viejos). Lo que no cuadra se descarta.
 */
function entradaAcotada(valor: unknown): ProjectMcpServer | null {
  if (!esObjeto(valor)) return null
  if ((valor.type === 'http' || valor.type === 'sse') && typeof valor.url === 'string')
    return { type: valor.type, url: valor.url }
  if (valor.type !== undefined && valor.type !== 'stdio') return null
  if (typeof valor.command !== 'string') return null
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
 *
 * SEGURIDAD: un .mcp.json define comandos que se ejecutan. Solo se lee en
 * proyectos de CONFIANZA (quien llama lo gatea, ADR-044), y aun asi cada
 * entrada pasa por la forma cerrada: la confianza decide SI se lee; la forma
 * acota QUE viaja. Null si falta el archivo, es invalido o nada sobrevive.
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
