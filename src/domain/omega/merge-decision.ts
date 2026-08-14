import type { GateOutcome } from '../repair/gate-result'
import type { OmegaVerdict } from '../repair/omega-verdict'
import type { PolicyEvaluation } from '../repair/auto-merge-policy'
import type { Severity } from '../shared/severity'
import { evidencia, motivo } from './merge-decision-text'
import type { NewOmegaEntry } from './omega-entry'

/** Todo lo que hizo falta para decidir, junto: la decision se defiende sola. */
export interface MergeDecision {
  readonly projectId: string
  readonly proposalId: string
  readonly severity: Severity
  readonly files: readonly string[]
  readonly diffLines: number
  /** null si NO se llego a evaluar; `configError` dice por que. */
  readonly policy: PolicyEvaluation | null
  readonly configError: string | null
  /** null si no se llego a correr (la politica freno antes). */
  readonly gate: GateOutcome | null
  /** El juicio de los seis ejes, o null si no se llego a el. */
  readonly omega: OmegaVerdict | null
  /**
   * Lo que dijo git cuando la integracion SE INTENTO y no salio; null si no se
   * intento o si salio. Es el unico fallo posterior a que todos los filtros
   * dijeran que si, y sin el ese caso se leeria como una integracion aplicada.
   */
  readonly applyError: string | null
  /** Presente solo si la integracion ocurrio. */
  readonly commitSha: string | null
}

// Como se NARRA la decision vive en `merge-decision-text.ts`: aqui esta QUE se
// registro, alli COMO se cuenta. La forma cambia mucho menos que el relato.

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
