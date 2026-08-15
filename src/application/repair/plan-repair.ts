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
import { recordMotorRun } from './record-motor-run'
import { recordAnalyzed, recordElegido } from './record-plan-events'

/** Candidatos: ACTIVE y abiertos, menos los declarados OBSOLETOS bajo el
 *  escaneo vigente (un fantasma no se re-analiza en la misma generacion) y
 *  menos los que ya tienen una propuesta VIVA: la seleccion es determinista, y
 *  sin este descuento el mismo hallazgo saldria elegido en cada ronda mientras
 *  su propuesta espera la firma (ADR-059, primera aplicacion). */
function candidates(context: AppContext, projectId: string, scanId: string): Candidate[] {
  const excluded = new Set(context.repairProposals.findObsoleteFindingIds(projectId, scanId))
  for (const id of context.repairProposals.findLiveFindingIds(projectId)) excluded.add(id)
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
  await recordElegido(context.eventLog, proposal, scanId)

  const result = await analyzeTarget(context.analystFor(project.path), selection)
  recordMotorRun(context, projectId, null, result.runMeta)
  // Lo que el analista noto de FORTRESS se guarda pase lo que pase con el
  // hallazgo: un limite del que se topo vale igual si el hallazgo era un fantasma.
  for (const nota of result.analysis.notes ?? []) {
    context.selfObservations.add({ ...nota, sourceProject: project.name })
  }
  const verdict: AnalysisVerdict = isActionable(result.analysis) ? 'REAL' : 'OBSOLETO'
  const state: ProposalState = verdict === 'REAL' ? 'ANALIZADO' : 'CADUCADO'
  if (!canTransition(proposal.state, state)) return proposal
  const patch = { state, analysisVerdict: verdict, analysisReason: result.analysis.risk, updatedAt: Date.now() } // prettier-ignore
  context.repairProposals.update(proposal.id, patch)
  await recordAnalyzed(context.eventLog, proposal, result, state)
  return { ...proposal, ...patch }
}
