import { spawn } from 'child_process'
import { GRAPH_INDEX_TOOL, withGraph } from '@domain/connectors/graph-mcp'
import { buildEnv } from '../claude-code/build-env'
import { escribirPrompt, type ConPrompt } from '../claude-code/prompt-por-stdin'
import { conSandbox } from '../sandbox/con-sandbox'
import { CLAUDE_BIN } from '../claude-code/claude-cli'

const PROMPT =
  'Corre la herramienta index_repository del MCP codebase-memory sobre la raiz de ' +
  'este repositorio (repo_path = la carpeta actual). No hagas nada mas y termina.'

/**
 * Indexa el repo lanzando claude -p con index_repository permitido (default mode:
 * plan bloquea el MCP). Es la unica corrida donde el grafo ESCRIBE, y solo se
 * dispara desde la accion de instalar, con un prompt acotado.
 */
/** Sin directorio de turno a proposito: este es el que ESCRIBE el indice de verdad, en la cache real. */
export function argsDeIndexar(): ConPrompt {
  return { args: ['-p', '--permission-mode', 'default', '--allowedTools', GRAPH_INDEX_TOOL, '--mcp-config', withGraph(null)], prompt: PROMPT } // prettier-ignore
}

export function indexGraph(
  projectPath: string,
  apiKey: string | null,
  onLog: (line: string) => void
): Promise<void> {
  const lanzamiento = argsDeIndexar()
  // La caja del CLI (ADR-092, clase A). Sin caja no se indexa: se resuelve sin
  // lanzar nada, y el registro lo cuenta como no hecho.
  const conCaja = conSandbox(lanzamiento.args, projectPath)
  if (!conCaja.ok) {
    onLog(conCaja.error)
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const child = spawn(CLAUDE_BIN, [...conCaja.value], { cwd: projectPath, env: buildEnv(apiKey) })
    escribirPrompt(child.stdin, lanzamiento.prompt) // ADR-112
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
