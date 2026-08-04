import {
  CREATE_AT,
  TRIAL_END,
  OFFICIAL_AT,
  type Capability,
  type CapabilityKind,
  type CapabilityPhase
} from './capability'

/** Fase que corresponde a una cantidad de episodios. Antes de 1.000 es propuesta. */
export function phaseFor(episodes: number): CapabilityPhase {
  if (episodes >= OFFICIAL_AT) return 'oficial'
  if (episodes >= TRIAL_END) return 'ciclo'
  if (episodes >= CREATE_AT) return 'prueba'
  return 'propuesta'
}

/** Episodios que faltan para el proximo salto; null si ya es oficial. */
export function nextMilestone(episodes: number): number | null {
  if (episodes < CREATE_AT) return CREATE_AT - episodes
  if (episodes < TRIAL_END) return TRIAL_END - episodes
  if (episodes < OFFICIAL_AT) return OFFICIAL_AT - episodes
  return null
}

/** Un agente nuevo lo aprueba un humano; una funcion o herramienta (reversible) no. */
export function requiresHumanApproval(kind: CapabilityKind): boolean {
  return kind === 'agente'
}

export interface PromotionGate {
  /** OMEGA audito y no veto (evidencia sin bloqueos). */
  readonly omegaApproved: boolean
  /** Un humano dio el visto bueno. Solo obligatorio para agentes. */
  readonly humanApproved: boolean
}

/**
 * Puede saltar de fase si los episodios cruzaron un umbral, OMEGA no veto y
 * —para un agente nuevo— un humano aprobo. OMEGA es testigo-no-actor: puede
 * BLOQUEAR, nunca promociona solo.
 */
export function canPromote(capability: Capability, gate: PromotionGate): boolean {
  if (phaseFor(capability.episodes) === capability.phase) return false
  if (!gate.omegaApproved) return false
  if (requiresHumanApproval(capability.kind) && !gate.humanApproved) return false
  return true
}
