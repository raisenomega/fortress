import type { Severity } from '../shared/severity'
import { DEFAULT_BLACKLIST } from './auto-merge-blacklist'

export interface AutoMergePolicy {
  /** El interruptor. Sin el en true, nada se integra solo, pase lo que pase. */
  readonly enabled: boolean
  readonly severities: readonly Severity[]
  /** Tope ESTRICTO de lineas del diff (insertions + deletions). */
  readonly maxDiffLines: number
  readonly maxFiles: number
  /** Patrones de RUTA, no palabras: contra los archivos que el fix toca. */
  readonly blacklist: readonly string[]
}

/**
 * La politica por defecto: conservadora, ampliable con evidencia.
 *
 * `enabled` nace en false a proposito. Un proyecto sin `.fortress/config` NUNCA
 * integra solo; encenderlo exige escribirlo en un archivo que la lista de
 * exclusion cubre a si misma, asi que el sistema no puede activarse solo.
 */
export const DEFAULT_POLICY: AutoMergePolicy = {
  enabled: false,
  severities: ['LOW', 'MEDIUM'],
  maxDiffLines: 20,
  maxFiles: 5,
  blacklist: DEFAULT_BLACKLIST
}

// La evaluacion vive en `auto-merge-evaluation.ts`: aqui esta QUE se permite,
// alli COMO se comprueba. Se re-exporta para no romper a quien ya importaba.
export {
  evaluate,
  type FailedCondition,
  type PolicyEvaluation,
  type ProposalDiff
} from './auto-merge-evaluation'
