import { spawn } from 'child_process'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { buildEnv } from '../claude-code/build-env'
import { trackChild } from '../claude-code/child-registry'
import { senalAl } from '../claude-code/kill-signal'
import { TOOLS_LECTURA } from './motor-tools'
import { processOmegaOut } from './omega-out'
import { relojDeCorrida } from './reloj-de-corrida'

const GRAPH = JSON.stringify({
  mcpServers: { 'codebase-memory': { command: 'codebase-memory-mcp', args: [] } }
})
const TIMEOUT_MS = 900_000

/** Lo que deja una corrida del critico. Sin `ok` no hubo objecion que leer. */
export type CriticoRunResult =
  | { ok: true; texto: string; runMeta: AnalystRunMeta }
  | { ok: false; error: string; timedOut: boolean; runMeta: AnalystRunMeta }

export interface GraphCritico {
  run(arbol: string, prompt: string): Promise<CriticoRunResult>
}

/**
 * El critico real: `claude -p` sobre el arbol, con las MISMAS herramientas que
 * OMEGA (`TOOLS_LECTURA` ya trae la navegacion del grafo). La diferencia vive
 * entera en el prompt, no aqui.
 *
 * REPLICA el ciclo de proceso de `graph-omega` y no lo reusa, por la misma
 * razon que aquel replica al generador: quien ataca y quien juzga no comparten
 * codigo, para que un cambio en uno no mueva al otro sin que nadie lo pida. Lo
 * que SI se reusa es `processOmegaOut` —abrir el sobre del CLI no es juzgar ni
 * criticar— y el reloj de corrida, que ya aprendio que un cero de tokens no es
 * lo mismo que no haber podido medir.
 */
export function createGraphCritico(claudeBin: string, projectId: string, timeoutMs = TIMEOUT_MS): GraphCritico { // prettier-ignore
  return {
    run: (arbol, prompt) => {
      const { sinFactura, meta } = relojDeCorrida(Date.now())
      const args = ['-p', prompt, '--output-format', 'json', '--mcp-config', GRAPH,
        '--strict-mcp-config', '--permission-mode', 'default', '--allowedTools', TOOLS_LECTURA] // prettier-ignore
      return new Promise((resolve) => {
        const child = spawn(claudeBin, args, { cwd: arbol, detached: true, env: buildEnv(null) })
        // Detached y por GRUPO: si no, Detener mata al lider y el MCP sigue vivo.
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
          // Murio por el plazo: no hay factura que leer, y cero seria mentira.
          if (timedOut) return resolve({ ok: false, error: 'timeout', timedOut, runMeta: sinFactura() }) // prettier-ignore
          const { usage, text } = processOmegaOut(out)
          const texto = text.trim()
          // Sin texto no hay objecion: el turno sigue, con el tribunal mudo.
          if (texto === '') return resolve({ ok: false, error: 'sin texto', timedOut: false, runMeta: meta(usage) }) // prettier-ignore
          resolve({ ok: true, texto, runMeta: meta(usage) })
        })
        // El critico no llego a existir: no es su objecion la que fallo.
        child.on('error', (e) => {
          clearTimeout(timer)
          resolve({ ok: false, error: e.message, timedOut: false, runMeta: sinFactura() })
        })
      })
    }
  }
}
