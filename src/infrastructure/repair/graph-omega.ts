import { TOOLS_LECTURA } from './motor-tools'
import { spawn } from 'child_process'
import { buildEnv } from '../claude-code/build-env'
import { trackChild } from '../claude-code/child-registry'
import { senalAl } from '../claude-code/kill-signal'
import { toOmegaOutcome, type OmegaRunResult } from './omega-outcome'
import { relojDeCorrida } from './reloj-de-corrida'

export type { OmegaRunResult }

const GRAPH = JSON.stringify({
  mcpServers: { 'codebase-memory': { command: 'codebase-memory-mcp', args: [] } }
})
// LECTURA ESTRICTA: grafo + Read/Grep/Glob. Sin Edit, sin Write, sin Bash.
const TIMEOUT_MS = 900_000

export interface GraphOmega {
  run(worktreePath: string, prompt: string): Promise<OmegaRunResult>
}

/** OMEGA real: claude -p en modo lectura, cwd anclado al worktree. Replica el
 *  patron del generador a proposito — juez y ejecutor no comparten codigo. */
// prettier-ignore
export function createGraphOmega(claudeBin: string, projectId: string, timeoutMs = TIMEOUT_MS): GraphOmega {
  return {
    run: (worktreePath, prompt) => {
      const { sinFactura, meta } = relojDeCorrida(Date.now())
      const args = ['-p', prompt, '--output-format', 'json', '--mcp-config', GRAPH,
        '--strict-mcp-config', '--permission-mode', 'default', '--allowedTools', TOOLS_LECTURA] // prettier-ignore
      return new Promise((resolve) => {
        // Recorte del CLI, no herencia cruda: ni el revisor ni sus nietos —el MCP
        // del grafo que el mismo levanta— ven las llaves de la sesion viva. Sin key
        // porque hoy se autentica con lo que hereda: quien paga no cambia aqui.
        const env = buildEnv(null)
        const child = spawn(claudeBin, args, { cwd: worktreePath, detached: true, env })
        // Detached: el registro tiene que matarlo por GRUPO o solo cae el lider.
        trackChild(child, projectId, 'grupo')
        let out = ''
        let timedOut = false
        const timer = setTimeout(() => {
          timedOut = true
          senalAl(child, 'SIGTERM', 'grupo')
          const escalation = setTimeout(() => senalAl(child, 'SIGKILL', 'grupo'), 3000)
          escalation.unref()
          child.once('close', () => clearTimeout(escalation))
        }, timeoutMs)
        child.stdout.on('data', (d: Buffer) => (out += d.toString()))
        child.on('close', () => {
          clearTimeout(timer)
          if (timedOut)
            // Murio por el plazo: no hay factura que leer, y cero seria mentira.
            return resolve({ ok: false, error: 'timeout', timedOut, runMeta: sinFactura() })
          // La lectura de la salida vive aparte: aqui solo el ciclo del proceso.
          resolve(toOmegaOutcome(out, meta))
        })
        child.on('error', (error) => {
          clearTimeout(timer)
          // El revisor no llego a existir: no es su juicio el que fallo.
          resolve({ ok: false, error: error.message, timedOut: false, noArranco: true, runMeta: sinFactura() }) // prettier-ignore
        })
      })
    }
  }
}
