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
    if (!summary.ok) return err(summary.error)
    const c = summary.value.counts
    // Muestra el resultado en el chat tras el escaneo (antes de arrancar agentes).
    onProgress(
      `\n\nResultado: ${summary.value.score}/100 — ${c.CRITICAL} CRITICAL, ${c.HIGH} HIGH, ${c.MEDIUM} MEDIUM, ${c.LOW} LOW\n`
    )
    return ok(summary.value.score)
  } catch (error) {
    return err(error instanceof Error ? error.message : 'Fallo inesperado al escanear')
  } finally {
    endRun(projectId)
  }
}
