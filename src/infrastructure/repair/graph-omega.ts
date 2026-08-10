import { spawn, type ChildProcess } from 'child_process'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { parseOmegaResponse } from '@domain/repair/omega-parse'
import { processOmegaOut } from './omega-out'
import type { OmegaVerdict } from '@domain/repair/omega-verdict'

const GRAPH = JSON.stringify({
  mcpServers: { 'codebase-memory': { command: 'codebase-memory-mcp', args: [] } }
})
// LECTURA ESTRICTA: grafo + Read/Grep/Glob. Sin Edit, sin Write, sin Bash.
const TOOLS =
  'mcp__codebase-memory__get_architecture,mcp__codebase-memory__search_graph,' +
  'mcp__codebase-memory__trace_path,mcp__codebase-memory__get_code_snippet,' +
  'mcp__codebase-memory__search_code,Read,Grep,Glob'
const TIMEOUT_MS = 900_000

export type OmegaRunResult =
  | { ok: true; verdict: OmegaVerdict; runMeta: AnalystRunMeta }
  | { ok: false; error: string; timedOut: boolean; runMeta: AnalystRunMeta }

export interface GraphOmega {
  run(worktreePath: string, prompt: string): Promise<OmegaRunResult>
}

/** Grupo entero (principio I3): matar solo al padre deja el MCP vivo. */
function killGroup(child: ChildProcess, signal: NodeJS.Signals): void {
  try {
    if (child.pid !== undefined) process.kill(-child.pid, signal)
  } catch {
    // Grupo ya muerto.
  }
}

/** OMEGA real: claude -p en modo lectura, cwd anclado al worktree. Replica el
 *  patron del generador a proposito — juez y ejecutor no comparten codigo. */
export function createGraphOmega(claudeBin: string, timeoutMs = TIMEOUT_MS): GraphOmega {
  return {
    run: (worktreePath, prompt) => {
      const startedAt = Date.now()
      const meta = (tokens: number): AnalystRunMeta => ({
        tokensUsed: tokens > 0 ? tokens : undefined,
        durationMs: Date.now() - startedAt, startedAt, endedAt: Date.now()
      }) // prettier-ignore
      const args = ['-p', prompt, '--output-format', 'json', '--mcp-config', GRAPH,
        '--strict-mcp-config', '--permission-mode', 'default', '--allowedTools', TOOLS] // prettier-ignore
      return new Promise((resolve) => {
        const child = spawn(claudeBin, args, { cwd: worktreePath, detached: true })
        let out = ''
        let timedOut = false
        const timer = setTimeout(() => {
          timedOut = true
          killGroup(child, 'SIGTERM')
          const escalation = setTimeout(() => killGroup(child, 'SIGKILL'), 3000)
          escalation.unref()
          child.once('close', () => clearTimeout(escalation))
        }, timeoutMs)
        child.stdout.on('data', (d: Buffer) => (out += d.toString()))
        child.on('close', () => {
          clearTimeout(timer)
          if (timedOut) return resolve({ ok: false, error: 'timeout', timedOut, runMeta: meta(0) })
          const { tokens, text } = processOmegaOut(out)
          const parsed = parseOmegaResponse(text)
          if ('error' in parsed) return resolve({ ok: false, error: 'omega_response_invalid', timedOut: false, runMeta: meta(tokens) }) // prettier-ignore
          resolve({ ok: true, verdict: parsed.verdict, runMeta: meta(tokens) })
        })
        child.on('error', (error) => {
          clearTimeout(timer)
          resolve({ ok: false, error: error.message, timedOut: false, runMeta: meta(0) })
        })
      })
    }
  }
}
