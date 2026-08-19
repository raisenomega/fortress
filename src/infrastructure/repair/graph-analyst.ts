import { spawn } from 'child_process'
import { buildAnalysisPrompt } from '@domain/repair/analysis-prompt'
import { discoverCorpus } from '../project/discover-corpus'
import type { Analyst } from '@domain/repair/analysis'
import { toAnalysis, type RunOut } from './parse-analysis'
import { EMPTY_USAGE, totalTokens } from '@domain/telemetry/token-usage'
import { parseUsage } from '../claude-code/parse-usage'

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
        const j = JSON.parse(out) as Record<string, unknown>
        const texto = typeof j.result === 'string' ? j.result : ''
        resolve({ result: texto, usage: parseUsage(j) })
      } catch {
        resolve({ result: out, usage: EMPTY_USAGE })
      }
    })
    child.on('error', () => resolve({ result: '', usage: EMPTY_USAGE }))
  })
}

/** Analista real: corre claude -p GRAFO-PRIMERO (read-only) y arma el Analysis
 *  con su factura. tokensUsed va undefined si el parser no lo saco: no se
 *  inventan numeros. El agentRunId no se sabe aqui todavia: lo pone quien
 *  asienta la corrida, que es quien recibe el id. */
export function createGraphAnalyst(claudeBin: string, projectPath: string): Analyst {
  return {
    study: async (target) => {
      const startedAt = Date.now()
      // El corpus se lee en cada estudio, no al crear el analista: entre dos
      // propuestas el proyecto puede haber ganado un ADR.
      const prompt = buildAnalysisPrompt(target, discoverCorpus(projectPath))
      const out = await run(claudeBin, projectPath, prompt)
      const endedAt = Date.now()
      return {
        analysis: toAnalysis(target, out),
        runMeta: {
          tokensUsed: totalTokens(out.usage) > 0 ? totalTokens(out.usage) : undefined,
          usage: out.usage,
          durationMs: endedAt - startedAt,
          startedAt,
          endedAt
        }
      }
    }
  }
}
