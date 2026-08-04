import type { AppContext } from '@application/context'
import { runScan } from '@application/scan/run-scan'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { err, ok, type Result } from '@domain/shared/result'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { endRun } from '../run-control'
import { guardRun } from '../run-guard'
import { createClaudeScanner } from '../scan/claude-scanner'

/** Escanea y devuelve el score, o err (que el standby clasifica). Siempre plan. */
export async function loopScan(
  context: AppContext,
  projectId: string,
  onProgress: (delta: string) => void
): Promise<Result<number>> {
  const busy = guardRun(context, projectId)
  if (busy !== null) return err(busy)

  const budget = readBudget(context)
  const scanner = createClaudeScanner(createClaudeCodeAgent(context.apiKeys, budget, usesApiKey(context)))
  try {
    const summary = await runScan(context, scanner, projectId, onProgress)
    return summary.ok ? ok(summary.value.score) : err(summary.error)
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Fallo inesperado al escanear')
  } finally {
    endRun(projectId)
  }
}
