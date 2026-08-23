import { spawn } from 'child_process'
import type { AnalystRunMeta } from '@domain/repair/analysis'
import { trabajoReal } from '@domain/repair/budget'
import { EMPTY_USAGE, type TokenUsage } from '@domain/telemetry/token-usage'
import { argsDelGenerador } from './generator-args'
import { desenlaceDelGenerador } from './generator-outcome'
import { trackChild } from '../claude-code/child-registry'

const TIMEOUT_MS = 15 * 60 * 1000

export type GeneratorResult =
  | { ok: true; runMeta: AnalystRunMeta }
  | { ok: false; error: string; turnosAgotados?: true; runMeta: AnalystRunMeta }

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
        tokensUsed: trabajoReal(usage) > 0 ? trabajoReal(usage) : undefined,
        usage,
        durationMs: Date.now() - startedAt,
        startedAt,
        endedAt: Date.now()
      })
      return new Promise((resolve) => {
        const child = spawn(claudeBin, [...argsDelGenerador(prompt)], { cwd: worktreePath })
        trackChild(child, projectId)
        let out = ''
        const timer = setTimeout(() => {
          child.kill('SIGKILL')
          resolve({ ok: false, error: `timeout tras ${Math.round(timeoutMs / 60000)} min`, runMeta: meta(EMPTY_USAGE) }) // prettier-ignore
        }, timeoutMs)
        child.stdout.on('data', (d: Buffer) => (out += d.toString()))
        child.on('close', (code) => {
          clearTimeout(timer)
          const fin = desenlaceDelGenerador(out, code)
          if (fin.ok) resolve({ ok: true, runMeta: meta(fin.usage) })
          else resolve({ ...fin, error: fin.error, runMeta: meta(fin.usage) })
        })
        child.on('error', (error) => {
          clearTimeout(timer)
          resolve({ ok: false, error: error.message, runMeta: meta(EMPTY_USAGE) })
        })
      })
    }
  }
}
