import type { Capability, StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import { omegaGate } from '@domain/system/capability-gate'
import { computeMaturity } from '@domain/system/capability-maturity'
import { evaluatePromotion } from '@domain/system/capability-promotion'
import type { AgentRunRepository } from '@domain/telemetry/agent-run-repository'

type Ledger = Pick<AgentRunRepository, 'episodeTallySince'>

/** Convierte una fila en su vista viva: episodios/madurez/veto/promocion del historial. */
export function liveCapability(stored: StoredCapability, ledger: Ledger): Capability {
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
  const promotion = evaluatePromotion(stored.kind, stored.phase, tally.episodes, omegaVeto)
  return { ...stored, episodes: tally.episodes, maturity, omegaVeto, promotion }
}

/**
 * Vista viva de todas las capacidades, derivada del historial real de agent_runs.
 * Nada se auto-incrementa; sin ejecuciones, la madurez es 0. El cumplimiento real
 * de OMEGA aun no alimenta la madurez (D10.3): hoy 1, y los fallos ya descuentan.
 */
export function describeCapabilities(
  capabilities: CapabilityRepository,
  ledger: Ledger
): readonly Capability[] {
  return capabilities.listAll().map((stored) => liveCapability(stored, ledger))
}
