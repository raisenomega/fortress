import { isActionable } from '@domain/repair/analysis'
import {
  canTransition,
  type AnalysisVerdict,
  type Proposal,
  type ProposalState
} from '@domain/repair/proposal'
import { selectTarget, type Candidate } from '@domain/repair/select-target'
import { newId } from '@domain/shared/id'
import type { AppContext } from '../context'
import { analyzeTarget } from './analyze-target'

/** Candidatos: ACTIVE y abiertos, menos los declarados OBSOLETOS bajo el
 *  escaneo vigente (un fantasma no se re-analiza en la misma generacion). */
function candidates(context: AppContext, projectId: string, scanId: string): Candidate[] {
  const excluded = new Set(context.repairProposals.findObsoleteFindingIds(projectId, scanId))
  return context.findings
    .listMemory(projectId)
    .filter((f) => f.lifecycle === 'ACTIVE' && f.status === 'open' && !excluded.has(f.id))
    .map(({ id, severity, title, file, line }) => ({ id, severity, title, file, line }))
}

/**
 * C1 -> C2 desde la app: ELIGE un hallazgo (determinista), ancla el HEAD del
 * repo y lo manda a ENTENDER (grafo-primero, solo lectura). Persiste el
 * veredicto: REAL deja la propuesta en ANALIZADO (lista para C3); OBSOLETO la
 * CADUCA y excluye al hallazgo hasta el proximo escaneo. La extincion del
 * hallazgo NO se toca: eso es del escaneo, con evidencia. NO genera fix.
 */
export async function planRepair(context: AppContext, projectId: string): Promise<Proposal | null> {
  const project = context.projects.findById(projectId)
  if (!project) return null
  const scanId = context.scans.listByProject(projectId, 1)[0]?.id ?? ''
  const selection = selectTarget(candidates(context, projectId, scanId))
  if (!selection) return null
  const baseSha = context.headSha(project.path)
  if (baseSha === null) return null

  const now = Date.now()
  const proposal: Proposal = { id: newId(), projectId, findingId: selection.target.id, baseSha, state: 'ELEGIDO', createdAt: now, updatedAt: now } // prettier-ignore
  context.repairProposals.insert(proposal)

  const analysis = await analyzeTarget(context.analystFor(project.path), selection)
  const verdict: AnalysisVerdict = isActionable(analysis) ? 'REAL' : 'OBSOLETO'
  const state: ProposalState = verdict === 'REAL' ? 'ANALIZADO' : 'CADUCADO'
  if (!canTransition(proposal.state, state)) return proposal
  const patch = { state, analysisVerdict: verdict, analysisReason: analysis.risk, updatedAt: Date.now() } // prettier-ignore
  context.repairProposals.update(proposal.id, patch)
  return { ...proposal, ...patch }
}
