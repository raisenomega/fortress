import type { Capability, StoredCapability } from '@domain/system/capability'
import type { CapabilityRepository } from '@domain/system/capability-repository'
import type { CapabilityEpisodeRepository } from '@domain/system/capability-episode-repository'
import type { EpisodeTally } from '@domain/system/capability-episode'
import { omegaGate } from '@domain/system/capability-gate'
import { computeMaturity } from '@domain/system/capability-maturity'
import { evaluatePromotion } from '@domain/system/capability-promotion'

/**
 * Vista viva de una capacidad, derivada de SUS episodios reales (resoluciones),
 * no de la actividad global. Sin episodios, la madurez es 0. El cumplimiento fino
 * de OMEGA aun no alimenta la madurez: hoy 1, y los fallos ya descuentan.
 */
export function liveCapability(stored: StoredCapability, tally: EpisodeTally): Capability {
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

/** Todas las capacidades vivas, cada una con la cuenta de sus propios episodios. */
export function describeCapabilities(
  capabilities: CapabilityRepository,
  episodes: CapabilityEpisodeRepository
): readonly Capability[] {
  return capabilities.listAll().map((stored) => liveCapability(stored, episodes.tallyFor(stored.id)))
}
