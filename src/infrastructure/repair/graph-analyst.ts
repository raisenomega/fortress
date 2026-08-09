import { spawn } from 'child_process'
import { buildAnalysisPrompt } from '@domain/repair/analysis-prompt'
import type { Analyst } from '@domain/repair/analysis'
import { toAnalysis, type RunOut } from './parse-analysis'

const GRAPH = JSON.stringify({
  mcpServers: { 'codebase-memory': { command: 'codebase-memory-mcp', args: [] } }
})
// Solo herramientas de LECTURA (grafo + Read/Grep/Glob): analisis read-only, sin editar.
const TOOLS =
  'mcp__codebase-memory__get_architecture,mcp__codebase-memory__search_graph,' +
  'mcp__codebase-memory__trace_path,mcp__codebase-memory__get_code_snippet,' +
  'mcp__codebase-memory__search_code,Read,Grep,Glob'

function run(bin: string, cwd: string, prompt: string): Promise<RunOut> {
  // El prompt DEBE ir pegado a -p (si no, otro flag se lo come). --strict-mcp-config
  // aisla el grafo (sin los MCP de claude.ai). Solo tools de lectura: read-only.
  const args = ['-p', prompt, '--output-format', 'json', '--mcp-config', GRAPH,
    '--strict-mcp-config', '--permission-mode', 'default', '--allowedTools', TOOLS] // prettier-ignore
  return new Promise((resolve) => {
    const child = spawn(bin, args, { cwd })
    let out = ''
    child.stdout.on('data', (d: Buffer) => (out += d.toString()))
    child.on('close', () => {
      try {
        const j = JSON.parse(out) as { result?: string; usage?: Record<string, number> }
        const u = j.usage ?? {}
        const tokens =
          (u.input_tokens ?? 0) + (u.output_tokens ?? 0) + (u.cache_read_input_tokens ?? 0)
        resolve({ result: j.result ?? '', tokens })
      } catch {
        resolve({ result: out, tokens: 0 })
      }
    })
    child.on('error', () => resolve({ result: '', tokens: 0 }))
  })
}

/** Analista real: corre claude -p GRAFO-PRIMERO (read-only) y arma el Analysis
 *  con su factura. tokensUsed va undefined si el parser no lo saco: no se
 *  inventan numeros. agentRunId queda pendiente (C2 no registra en agent_runs). */
export function createGraphAnalyst(claudeBin: string, projectPath: string): Analyst {
  return {
    study: async (target) => {
      const startedAt = Date.now()
      const out = await run(claudeBin, projectPath, buildAnalysisPrompt(target))
      const endedAt = Date.now()
      return {
        analysis: toAnalysis(target, out),
        runMeta: {
          tokensUsed: out.tokens > 0 ? out.tokens : undefined,
          durationMs: endedAt - startedAt,
          startedAt,
          endedAt
        }
      }
    }
  }
}
