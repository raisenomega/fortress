import { fusionPorJuicio, idsAdmitidos } from '@domain/project/fusion-por-juicio'
import type { Project } from '@domain/project/project'
import { isActionable, type Analysis } from '@domain/repair/analysis'
import type { Proposal } from '@domain/repair/proposal'
import type { ProposalPatch } from '@domain/repair/proposal-repository'
import type { AppContext } from '../context'

/**
 * El corte 2 de los hermanos (ADR-101 §3): el juicio «A es el mismo defecto que
 * B» deja de morir en prosa. Se admiten SOLO los ids que se le citaron; con
 * ellos y el objetivo, la mas antigua sobrevive (ADR-071) y las demas quedan
 * fusionadas con su clave como alias. Si el objetivo es el que se absorbe, la
 * propuesta caduca diciendo con quien: el defecto vive en la ganadora y el
 * motor la elegira. Solo con veredicto REAL: un OBSOLETO ya tiene su camino.
 */
export function fundirPorJuicio(
  context: AppContext,
  project: Project,
  proposal: Proposal,
  analysis: Analysis
): ProposalPatch | null {
  if (!isActionable(analysis)) return null
  const ids = idsAdmitidos(analysis.mismoDefectoQue, analysis.target.hermanosCitados)
  if (ids.length === 0) return null
  const grupo = new Set([analysis.target.id, ...ids])
  const filas = context.findings
    .listMemory(project.id)
    .filter((f) => grupo.has(f.id) && f.lifecycle !== 'EXTINCT')
    .map((f) => ({ id: f.id, identidad: f.identity, firstSeen: f.firstSeen }))
  const fusion = fusionPorJuicio(filas)
  if (fusion === null) return null
  context.findings.fundirPorJuicio(project.id, fusion)
  if (fusion.ganadora === analysis.target.id) return null
  const patch: ProposalPatch = { state: 'CADUCADO', analysisVerdict: 'REAL', analysisReason: `fusionada-con-${fusion.ganadora}`, updatedAt: Date.now() } // prettier-ignore
  context.repairProposals.update(proposal.id, patch)
  return patch
}
