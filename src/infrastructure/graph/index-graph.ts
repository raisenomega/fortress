import { spawn } from 'child_process'
import { GRAPH_TOOL_RULE, withGraph } from '@domain/connectors/graph-mcp'
import { buildEnv } from '../claude-code/build-env'
import { CLAUDE_BIN } from '../claude-code/claude-cli'

const PROMPT =
  'Corre la herramienta index_repository del MCP codebase-memory sobre la raiz de ' +
  'este repositorio (repo_path = la carpeta actual). No hagas nada mas y termina.'

/**
 * Indexa el repo lanzando claude -p con index_repository permitido (default mode:
 * plan bloquea el MCP). Es la unica corrida donde el grafo ESCRIBE, y solo se
 * dispara desde la accion de instalar, con un prompt acotado.
 */
export function indexGraph(
  projectPath: string,
  apiKey: string | null,
  onLog: (line: string) => void
): Promise<void> {
  const args = [
    '-p',
    PROMPT,
    '--permission-mode',
    'default',
    '--allowedTools',
    GRAPH_TOOL_RULE,
    '--mcp-config',
    withGraph(null)
  ]
  return new Promise((resolve) => {
    const child = spawn(CLAUDE_BIN, args, { cwd: projectPath, env: buildEnv(apiKey) })
    const timer = setTimeout(() => {
      child.kill()
      resolve()
    }, 600_000)
    const stop = (): void => {
      clearTimeout(timer)
      resolve()
    }
    child.stdout.on('data', () => onLog('.'))
    child.on('close', stop)
    child.on('error', stop)
  })
}
