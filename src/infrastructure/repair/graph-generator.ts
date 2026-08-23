import { spawn } from 'child_process'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { EMPTY_USAGE, totalTokens, type TokenUsage } from '@domain/telemetry/token-usage'
import { parseUsage } from '../claude-code/parse-usage'
import { trackChild } from '../claude-code/child-registry'

const GRAPH = JSON.stringify({
  mcpServers: { 'codebase-memory': { command: 'codebase-memory-mcp', args: [] } }
})
// Lectura (grafo + Read/Grep/Glob) MAS edicion (Edit/Write). SIN Bash: el
// generador no corre git ni tests; el commit y el gate son del motor.
const TOOLS =
  'mcp__codebase-memory__get_architecture,mcp__codebase-memory__search_graph,' +
  'mcp__codebase-memory__trace_path,mcp__codebase-memory__get_code_snippet,' +
  'mcp__codebase-memory__search_code,Read,Grep,Glob,Edit,Write'

const TIMEOUT_MS = 15 * 60 * 1000

export type GeneratorResult =
  { ok: true; runMeta: AnalystRunMeta } | { ok: false; error: string; runMeta: AnalystRunMeta }

export interface GraphGenerator {
  generate(worktreePath: string, prompt: string): Promise<GeneratorResult>
}

/**
 * C3 — el UNICO agente del motor que EDITA, y solo dentro del worktree (cwd
 * anclado). Replica el patron de graph-analyst a proposito: preferimos
 * duplicacion controlada a acoplar el analista al generador. Los archivos
 * tocados NO se le creen al agente: los lee el motor con git, despues.
 */
// prettier-ignore
export function createGraphGenerator(claudeBin: string, projectId: string, timeoutMs = TIMEOUT_MS): GraphGenerator {
  return {
    generate: (worktreePath, prompt) => {
      const startedAt = Date.now()
      const meta = (usage: TokenUsage): AnalystRunMeta => ({
        tokensUsed: totalTokens(usage) > 0 ? totalTokens(usage) : undefined,
        usage,
        durationMs: Date.now() - startedAt,
        startedAt,
        endedAt: Date.now()
      })
      const args = ['-p', prompt, '--output-format', 'json', '--mcp-config', GRAPH,
        '--strict-mcp-config', '--permission-mode', 'acceptEdits', '--allowedTools', TOOLS] // prettier-ignore
      return new Promise((resolve) => {
        const child = spawn(claudeBin, args, { cwd: worktreePath })
        trackChild(child, projectId)
        let out = ''
        const timer = setTimeout(() => {
          child.kill('SIGKILL')
          resolve({ ok: false, error: `timeout tras ${Math.round(timeoutMs / 60000)} min`, runMeta: meta(EMPTY_USAGE) }) // prettier-ignore
        }, timeoutMs)
        child.stdout.on('data', (d: Buffer) => (out += d.toString()))
        child.on('close', (code) => {
          clearTimeout(timer)
          let usage = EMPTY_USAGE
          try {
            const j = JSON.parse(out) as Record<string, unknown>
            usage = parseUsage(j)
          } catch {
            // Sin JSON no hay factura: tokensUsed queda undefined, no inventado.
          }
          if (code === 0) resolve({ ok: true, runMeta: meta(usage) })
          else resolve({ ok: false, error: `el generador salio con codigo ${code}`, runMeta: meta(usage) }) // prettier-ignore
        })
        child.on('error', (error) => {
          clearTimeout(timer)
          resolve({ ok: false, error: error.message, runMeta: meta(EMPTY_USAGE) })
        })
      })
    }
  }
}
