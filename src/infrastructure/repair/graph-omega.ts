import { spawn } from 'child_process'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { trackChild } from '../claude-code/child-registry'
import { senalAl } from '../claude-code/kill-signal'
import { toOmegaOutcome, type OmegaRunResult } from './omega-outcome'
import { EMPTY_USAGE, totalTokens, type TokenUsage } from '@domain/telemetry/token-usage'

export type { OmegaRunResult }

const GRAPH = JSON.stringify({
  mcpServers: { 'codebase-memory': { command: 'codebase-memory-mcp', args: [] } }
})
// LECTURA ESTRICTA: grafo + Read/Grep/Glob. Sin Edit, sin Write, sin Bash.
const TOOLS =
  'mcp__codebase-memory__get_architecture,mcp__codebase-memory__search_graph,' +
  'mcp__codebase-memory__trace_path,mcp__codebase-memory__get_code_snippet,' +
  'mcp__codebase-memory__search_code,Read,Grep,Glob'
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
      const startedAt = Date.now()
      const meta = (usage: TokenUsage): AnalystRunMeta => ({
        tokensUsed: totalTokens(usage) > 0 ? totalTokens(usage) : undefined, usage,
        durationMs: Date.now() - startedAt, startedAt, endedAt: Date.now()
      }) // prettier-ignore
      const args = ['-p', prompt, '--output-format', 'json', '--mcp-config', GRAPH,
        '--strict-mcp-config', '--permission-mode', 'default', '--allowedTools', TOOLS] // prettier-ignore
      return new Promise((resolve) => {
        const child = spawn(claudeBin, args, { cwd: worktreePath, detached: true })
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
            return resolve({ ok: false, error: 'timeout', timedOut, runMeta: meta(EMPTY_USAGE) })
          // La lectura de la salida vive aparte: aqui solo el ciclo del proceso.
          resolve(toOmegaOutcome(out, meta))
        })
        child.on('error', (error) => {
          clearTimeout(timer)
          resolve({ ok: false, error: error.message, timedOut: false, runMeta: meta(EMPTY_USAGE) })
        })
      })
    }
  }
}
