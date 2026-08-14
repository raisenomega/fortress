import type { MergeDecision } from '@domain/omega/merge-decision'
import type { Project } from '@domain/project/project'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalEvent } from '@domain/repair/proposal-event'
import type { Severity } from '@domain/shared/severity'
import type { AppContext } from '../context'
import { collectPostOmegaState, type PostOmegaState } from './collect-post-omega-state'

/** Todo lo que hace falta para juzgar una integracion, reunido desde un id. */
export interface AutoMergeCase {
  readonly proposal: Proposal
  readonly project: Project
  readonly state: PostOmegaState
  /** Del hallazgo que origino la propuesta: la politica juzga por severidad. */
  readonly severity: Severity
  /** Los eventos ya leidos: el cursor del libro sale de aqui, sin releerlo. */
  readonly events: readonly ProposalEvent[]
}

export type GatherOutcome =
  | { readonly ok: true; readonly caso: AutoMergeCase }
  | { readonly ok: false; readonly reason: string }

/**
 * Deriva el expediente entero desde el id de la propuesta. Las cuatro salidas
 * negativas son "no se pudo montar el caso", no "se decidio que no": ninguna
 * asienta en el libro, porque no hay decision que registrar todavia.
 *
 * `unknown-severity` es la mas sutil: sin severidad no hay politica que
 * evaluar, y ponerle una por defecto seria juzgar el fix por un dato inventado.
 */
export async function gatherCase(ctx: AppContext, proposalId: string): Promise<GatherOutcome> {
  const no = (reason: string): GatherOutcome => ({ ok: false, reason })
  const proposal = ctx.repairProposals.findById(proposalId)
  if (proposal === null) return no('proposal-not-found')
  const project = ctx.projects.findById(proposal.projectId)
  if (project === null) return no('project-not-found')

  const events = await ctx.eventLog.list(proposalId)
  const state = collectPostOmegaState(events)
  if (state === null) return no('incomplete-state')

  const hallazgo = ctx.findings.listMemory(proposal.projectId).find((f) => f.id === proposal.findingId) // prettier-ignore
  if (hallazgo === undefined) return no('unknown-severity')
  return { ok: true, caso: { proposal, project, state, severity: hallazgo.severity, events } }
}

/** El asiento con lo ya sabido y las cuatro incognitas en null. Cada rama llena las suyas. */
export function decisionBase(caso: AutoMergeCase): MergeDecision {
  return {
    projectId: caso.proposal.projectId,
    proposalId: caso.proposal.id,
    severity: caso.severity,
    files: caso.state.files,
    diffLines: caso.state.insertions + caso.state.deletions,
    gate: caso.state.gate,
    omega: caso.state.omega,
    policy: null,
    configError: null,
    applyError: null,
    commitSha: null
  }
}
