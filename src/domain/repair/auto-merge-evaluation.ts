import type { Severity } from '../shared/severity'
import { firstMatch } from '../shared/path-glob'
import type { AutoMergePolicy } from './auto-merge-policy'

/** Lo minimo del fix que hace falta para juzgarlo. Espeja el diff del worktree. */
export interface ProposalDiff {
  readonly severity: Severity
  readonly files: readonly string[]
  readonly insertions: number
  readonly deletions: number
}

export type FailedCondition = 'disabled' | 'severity' | 'diff' | 'files' | 'blacklist'

export interface PolicyEvaluation {
  readonly allowed: boolean
  /** Por que NO se integra sola, o null si si. */
  readonly reason: string | null
  readonly conditionFailed: FailedCondition | null
}

function no(conditionFailed: FailedCondition, reason: string): PolicyEvaluation {
  return { allowed: false, reason, conditionFailed }
}

/**
 * Decide si una propuesta puede integrarse sin firma humana. El interruptor
 * corta antes que nada; despues, cuatro condiciones ACUMULATIVAS en orden de
 * coste: severidad, tamano, alcance y por ultimo la lista de exclusion, la
 * unica que recorre rutas. Devuelve la PRIMERA que falla, con motivo citable.
 */
export function evaluate(diff: ProposalDiff, policy: AutoMergePolicy): PolicyEvaluation {
  // Encender es un acto humano, escrito en un archivo que el sistema no toca.
  if (!policy.enabled) return no('disabled', 'La integracion automatica no esta activada')

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

  return { allowed: true, reason: null, conditionFailed: null }
}
