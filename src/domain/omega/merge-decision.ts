import type { GateOutcome } from '../repair/gate-result'
import type { OmegaVerdict } from '../repair/omega-verdict'
import type { PolicyEvaluation } from '../repair/auto-merge-policy'
import type { Severity } from '../shared/severity'
import type { NewOmegaEntry } from './omega-entry'

/** Todo lo que hizo falta para decidir, junto: la decision se defiende sola. */
export interface MergeDecision {
  readonly projectId: string
  readonly proposalId: string
  readonly severity: Severity
  readonly files: readonly string[]
  readonly diffLines: number
  readonly policy: PolicyEvaluation
  /** null si no se llego a correr (la politica freno antes). */
  readonly gate: GateOutcome | null
  /** El juicio de los seis ejes, o null si no se llego a el. */
  readonly omega: OmegaVerdict | null
  /** Presente solo si la integracion ocurrio. */
  readonly commitSha: string | null
}

/** Por que NO se integro sola, en orden de aparicion en la cadena. */
function motivo(d: MergeDecision): string | null {
  if (d.policy.reason !== null) return `politica — ${d.policy.reason}`
  if (d.gate !== null && !d.gate.ok) return `gate — ${d.gate.reason} en ${d.gate.failedAt}`
  if (d.omega !== null && d.omega.veredicto_global === 'VETADO') {
    return `revisor — ${d.omega.razon}`
  }
  return null
}

/** Lo comprobable despues: que se miro, no solo que se decidio. */
function evidencia(d: MergeDecision): string {
  const partes = [
    `propuesta=${d.proposalId.slice(0, 8)}`,
    `severidad=${d.severity}`,
    `lineas=${d.diffLines}`,
    `archivos=${d.files.join(', ')}`
  ]
  if (d.commitSha !== null) partes.push(`commit=${d.commitSha.slice(0, 7)}`)
  if (d.policy.conditionFailed !== null) partes.push(`condicion=${d.policy.conditionFailed}`)
  return partes.join(' · ')
}

/**
 * Asiento de una decision de integracion automatica. Hereda la doctrina de la
 * decision de publicacion: no cambia la regla, la documenta con pruebas. Un
 * veto no es inapelable por decreto; es fuerte porque cita lo que miro.
 */
export function mergeDecisionEntry(d: MergeDecision): NewOmegaEntry {
  const razon = motivo(d)
  const summary =
    razon === null
      ? `Integracion automatica aplicada: ${d.severity}, ${d.diffLines} lineas en ${d.files.length} archivo(s).`
      : `Integracion automatica denegada por ${razon}`

  return {
    projectId: d.projectId,
    agentId: 'sentinel-omega',
    kind: 'merge',
    verdict: razon === null ? 'ok' : 'veto',
    summary,
    evidence: evidencia(d)
  }
}
