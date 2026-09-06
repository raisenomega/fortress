import { existsSync, readFileSync, writeFileSync } from 'fs'
import { rutaContenida } from '../fs/ruta-contenida'
import { GRAPH_BIN, GRAPH_SERVER } from '@domain/connectors/graph-mcp'

const SERVER = { type: 'stdio', command: GRAPH_BIN, args: [] }

interface McpFile {
  readonly mcpServers?: Record<string, unknown>
}

/**
 * Escribe (o mergea) el servidor codebase-memory en el `.mcp.json` del proyecto,
 * apuntando al BINARIO instalado. Idempotente: respeta otros servidores y solo
 * (re)escribe la entrada del grafo. Asi `claude` a pelo tambien lo ve.
 */
export function writeProjectMcp(projectPath: string): void {
  // Un `.mcp.json` que sea un enlace fuera del proyecto se sobrescribiria con
  // la config del grafo. No se escribe donde no se puede probar que se esta.
  const file = rutaContenida(projectPath, '.mcp.json')
  if (file === null) return
  let base: McpFile = {}
  if (existsSync(file)) {
    try {
      base = JSON.parse(readFileSync(file, 'utf8')) as McpFile
    } catch {
      base = {}
    }
  }
  const mcpServers = { ...(base.mcpServers ?? {}), [GRAPH_SERVER]: SERVER }
  writeFileSync(file, `${JSON.stringify({ ...base, mcpServers }, null, 2)}\n`)
}
