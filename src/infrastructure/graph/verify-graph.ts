import { spawn } from 'child_process'
import { GRAPH_READ_TOOLS, withGraph } from '@domain/connectors/graph-mcp'
import type { GraphVerify } from '@domain/graph/graph-actions'
import { parseInitEvent } from '@domain/graph/parse-init'
import { buildEnv } from '../claude-code/build-env'
import { conSandbox } from '../sandbox/con-sandbox'
import { CLAUDE_BIN } from '../claude-code/claude-cli'

const FAILED: GraphVerify = { connected: false, tools: [] }

/** Sin directorio de turno a proposito: verifica que el servidor conecta con la cache real. */
export function verifyArgs(): string[] {
  return [
    '-p',
    'ok',
    '--output-format',
    'stream-json',
    '--verbose',
    '--permission-mode',
    'default',
    '--allowedTools',
    ...GRAPH_READ_TOOLS,
    '--mcp-config',
    withGraph(null)
  ]
}

/**
 * Verifica en una sesion REAL de claude -p que el grafo llega: lanza un turno
 * minimo y lee el evento init (que servidores conectaron y con que tools), luego
 * corta. Barato: no espera a que el modelo razone, solo al handshake MCP.
 */
export function verifyGraph(projectPath: string, apiKey: string | null): Promise<GraphVerify> {
  // La caja del CLI (ADR-092, clase A). Sin caja, el grafo cuenta como no
  // verificado: FAILED, que es lo que la UI ya sabe ensenar.
  const args = conSandbox(verifyArgs(), projectPath)
  if (!args.ok) return Promise.resolve(FAILED)
  return new Promise((resolve) => {
    const child = spawn(CLAUDE_BIN, [...args.value], { cwd: projectPath, env: buildEnv(apiKey) })
    let buffer = ''
    let done = false
    const finish = (result: GraphVerify): void => {
      if (done) return
      done = true
      child.kill()
      resolve(result)
    }
    setTimeout(() => finish(FAILED), 60_000)
    child.on('error', () => finish(FAILED))
    child.on('close', () => finish(FAILED))
    child.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString()
      let nl = buffer.indexOf('\n')
      while (nl >= 0) {
        const line = buffer.slice(0, nl).trim()
        buffer = buffer.slice(nl + 1)
        const parsed = line.startsWith('{') ? parseInitEvent(line) : null
        if (parsed) finish(parsed)
        nl = buffer.indexOf('\n')
      }
    })
  })
}
