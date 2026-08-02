import { readFileSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { NOT_INSTALLED, type GraphStatus } from '@domain/graph/graph-status'

/** Cualquier servidor cuyo nombre suene a grafo de codigo. */
const GRAPH_NAME = /codebase[-_]?memory|knowledge[-_]?graph/i

function serversIn(file: string, path: readonly string[]): Record<string, unknown> {
  try {
    let node = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>
    for (const key of path) node = (node?.[key] ?? {}) as Record<string, unknown>
    return node ?? {}
  } catch {
    return {}
  }
}

function findIn(servers: Record<string, unknown>, source: string): GraphStatus | null {
  const name = Object.keys(servers).find((key) => GRAPH_NAME.test(key))
  return name ? { state: 'configurado', server: name, source } : null
}

/**
 * Solo detecta si el grafo esta configurado. NO lee sus datos: su formato de
 * almacenamiento no se ha podido verificar contra una instalacion real, y
 * escribir un lector contra un esquema que nadie ha visto es adivinar.
 */
export function detectGraph(projectPath: string): GraphStatus {
  const local = join(projectPath, '.mcp.json')
  const global = join(homedir(), '.claude.json')

  return (
    findIn(serversIn(local, ['mcpServers']), '.mcp.json del proyecto') ??
    findIn(serversIn(global, ['projects', projectPath, 'mcpServers']), '~/.claude.json') ??
    findIn(serversIn(global, ['mcpServers']), '~/.claude.json (global)') ??
    NOT_INSTALLED
  )
}
