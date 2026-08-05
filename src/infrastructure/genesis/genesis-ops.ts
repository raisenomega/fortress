import { mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import type { AppContext } from '@application/context'
import { describeCapabilities } from '@application/system/describe-capabilities'
import { runLearningEpisode } from '@application/system/run-learning-episode'
import { usesApiKey } from '@application/settings/read-auth-source'
import { readBudget } from '@application/settings/read-budget'
import { createClaudeCodeAgent } from '../claude-code/claude-code-agent'
import { costTrackingAgent } from '../claude-code/cost-tracking-agent'

/** La proxima capacidad a entrenar: la no-oficial con menos episodios (reparto justo). */
export function nextGenesisCapability(context: AppContext): string | null {
  const pending = describeCapabilities(context.capabilities, context.capabilityEpisodes).filter(
    (capability) => capability.phase !== 'oficial'
  )
  if (pending.length === 0) return null
  return pending.reduce((a, b) => (a.episodes <= b.episodes ? a : b)).id
}

/** Corre UN episodio en un sandbox temporal (nunca el repo de FORTRESS), con el
 *  coste real reportado a onCost. Limpia el temporal siempre. */
export async function runGenesisEpisode(
  context: AppContext,
  id: string,
  onCost: (usd: number) => void
): Promise<void> {
  const sandbox = mkdtempSync(join(tmpdir(), 'fortress-genesis-'))
  try {
    const base = createClaudeCodeAgent(context.apiKeys, readBudget(context), usesApiKey(context))
    await runLearningEpisode(context, id, costTrackingAgent(base, onCost), sandbox)
  } finally {
    rmSync(sandbox, { recursive: true, force: true })
  }
}
