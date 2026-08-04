import type { Capability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import { omegaGate } from '@domain/system/capability-gate'
import { phaseFor } from '@domain/system/capability-lifecycle'
import { computeMaturity } from '@domain/system/capability-maturity'
import type { AgentRunRepository } from '@domain/telemetry/agent-run-repository'

type Ledger = Pick<AgentRunRepository, 'episodeTallySince'>

/**
 * Vista viva de las capacidades: sus episodios, fase y madurez se DERIVAN del
 * historial real de ejecuciones (agent_runs) desde que cada una nacio. Nada se
 * guarda ni se auto-incrementa; sin ejecuciones, la madurez es 0. El cumplimiento
 * real de OMEGA aun no se cablea (D10.3): por ahora 1, y los fallos ya descuentan.
 */
export function describeCapabilities(
  capabilities: CapabilityRepository,
  ledger: Ledger
): readonly Capability[] {
  return capabilities.listAll().map((stored) => {
    const tally = ledger.episodeTallySince(stored.createdAt)
    const maturity = computeMaturity({ ...tally, complianceRate: 1 })
    const omegaVeto = omegaGate({
      okChecks: 0,
      discrepancies: 0,
      runs: tally.episodes,
      failedRuns: tally.failures,
      outputTokens: 0,
      verifiedFindings: 0
    })
    return { ...stored, episodes: tally.episodes, phase: phaseFor(tally.episodes), maturity, omegaVeto }
  })
}
