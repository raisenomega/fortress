import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Servidores MCP declarados en el `.mcp.json` del proyecto. Es donde el operador
 * (o `claude mcp add`) dejo el codebase-memory apuntando al graph.db real, con la
 * ruta y args que de verdad conectan. FORTRESS los pasa en --mcp-config porque en
 * headless el CLI no auto-aprueba los servidores del .mcp.json de disco.
 *
 * SEGURIDAD: un .mcp.json define comandos que se ejecutan. Solo se leen para
 * proyectos de CONFIANZA (quien llama lo gatea); en un repo auditado seria
 * ejecucion de codigo arbitrario. Devuelve null si no hay archivo o es invalido.
 */
export function readProjectMcpServers(projectPath: string): Record<string, unknown> | null {
  try {
    const raw = readFileSync(join(projectPath, '.mcp.json'), 'utf8')
    const parsed = JSON.parse(raw) as { mcpServers?: Record<string, unknown> }
    const servers = parsed.mcpServers
    return servers && typeof servers === 'object' ? servers : null
  } catch {
    return null
  }
}
