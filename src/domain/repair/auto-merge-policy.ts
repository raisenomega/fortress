import type { Severity } from '../shared/severity'
import { firstMatch } from '../shared/path-glob'
import { DEFAULT_BLACKLIST } from './auto-merge-blacklist'

export interface AutoMergePolicy {
  readonly severities: readonly Severity[]
  /** Tope ESTRICTO de lineas del diff (insertions + deletions). */
  readonly maxDiffLines: number
  readonly maxFiles: number
  /** Patrones de RUTA, no palabras: se comparan contra los archivos del fix. */
  readonly blacklist: readonly string[]
}

/** La politica firmada por defecto: conservadora, ampliable con evidencia. */
export const DEFAULT_POLICY: AutoMergePolicy = {
  severities: ['LOW', 'MEDIUM'],
  maxDiffLines: 20,
  maxFiles: 5,
  blacklist: DEFAULT_BLACKLIST
}

/** Lo minimo del fix que hace falta para juzgarlo. Espeja el diff del worktree. */
export interface ProposalDiff {
  readonly severity: Severity
  readonly files: readonly string[]
  readonly insertions: number
  readonly deletions: number
}

export type FailedCondition = 'severity' | 'diff' | 'files' | 'blacklist'

export interface PolicyEvaluation {
  readonly allowed: boolean
  /** Por que NO se puede integrar sola, o null si si se puede. */
  readonly reason: string | null
  readonly conditionFailed: FailedCondition | null
}

const OK: PolicyEvaluation = { allowed: false, reason: null, conditionFailed: null }

function no(conditionFailed: FailedCondition, reason: string): PolicyEvaluation {
  return { allowed: false, reason, conditionFailed }
}

/**
 * Decide si una propuesta puede integrarse sin firma humana. Las cuatro
 * condiciones son ACUMULATIVAS y se evaluan en orden de coste: severidad,
 * tamano, alcance y por ultimo la lista de exclusion, que es la unica que
 * recorre rutas. Devuelve la PRIMERA que falla, con su motivo citable.
 */
export function evaluate(diff: ProposalDiff, policy: AutoMergePolicy): PolicyEvaluation {
  if (!policy.severities.includes(diff.severity)) {
    return no('severity', `Severidad ${diff.severity}: exige firma humana`)
  }

  const lineas = diff.insertions + diff.deletions
  if (lineas >= policy.maxDiffLines) {
    return no('diff', `El fix cambia ${lineas} lineas; el tope son ${policy.maxDiffLines}`)
  }

  if (diff.files.length > policy.maxFiles) {
    return no('files', `El fix toca ${diff.files.length} archivos; el tope son ${policy.maxFiles}`)
  }

  for (const file of diff.files) {
    const patron = firstMatch(file, policy.blacklist)
    if (patron !== null) {
      return no('blacklist', `${file} esta excluido de la integracion automatica (${patron})`)
    }
  }

  return { ...OK, allowed: true }
}
