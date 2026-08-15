import { DEFAULT_POLICY, evaluate } from '@domain/repair/auto-merge-policy'
import { recordMergeDecision } from '../omega/record-merge-decision'
import type { AppContext } from '../context'
import { applyAutoMerge } from './apply-auto-merge'
import { decisionBase, gatherCase } from './auto-merge-gather'
import type { AutoMergeDeps, AutoMergeInput, AutoMergeResult } from './auto-merge-types'

/**
 * Integra sola una propuesta que OMEGA aprobo, si y solo si la politica del
 * proyecto lo permite. Corre detras del juicio semantico, no en su lugar.
 *
 * La ausencia de `.fortress/config` NO es un caso aparte: hereda el default,
 * que nace apagado. Se evalua igual que cualquier otro proyecto y sale por la
 * misma puerta, con una `PolicyEvaluation` de verdad en el asiento. Solo la
 * configuracion ILEGIBLE deja la politica en null, porque ahi de verdad no se
 * llego a evaluar nada.
 */
export async function autoMergeProposal(
  ctx: AppContext,
  deps: AutoMergeDeps,
  input: AutoMergeInput
): Promise<AutoMergeResult> {
  const reunido = await gatherCase(ctx, input.proposalId)
  if (!reunido.ok) return { applied: false, reason: reunido.reason, denial: null }

  const caso = reunido.caso
  const base = decisionBase(caso)
  const config = deps.readConfig(caso.project.path)
  if (config.kind === 'invalid') {
    recordMergeDecision(ctx, { ...base, configError: config.reason })
    return { applied: false, reason: 'config-invalid', denial: null }
  }

  const { state, severity } = caso
  const diff = { severity, files: state.files, insertions: state.insertions, deletions: state.deletions } // prettier-ignore
  const policy = evaluate(diff, config.kind === 'valid' ? config.policy : DEFAULT_POLICY)
  if (!policy.allowed) {
    recordMergeDecision(ctx, { ...base, policy })
    const razon = `policy-blocked-${policy.conditionFailed}`
    const reason = config.kind === 'valid' ? razon : 'not-configured'
    return { applied: false, reason, denial: policy.conditionFailed }
  }

  return applyAutoMerge(ctx, deps, caso, policy, base)
}
