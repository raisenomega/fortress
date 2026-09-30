import { integracionAutomaticaPermitida } from '@domain/repair/integracion-sin-firma'
import type { AppContext } from '../context'

/**
 * Si la puerta AUTOMATICA puede tocar el arbol vivo de este proyecto.
 *
 * Vive aparte del caso de uso que la consulta porque es la regla, no el flujo:
 * quien venga a cambiar cuando el motor integra solo tiene que encontrarla
 * entera, con su motivo, y no repartida en una condicion dentro de un `if`.
 *
 * Un proyecto que no se puede ubicar cuenta como PROPIO. No saber de quien es
 * el codigo no es permiso para integrarlo solo, y la duda contando a favor de
 * integrar es exactamente como se pierde una garantia sin que nadie lo note.
 */
export function integrableSinFirma(
  ctx: AppContext,
  proposalId: string,
  esRepoPropio: (projectPath: string) => boolean
): boolean {
  const proposal = ctx.repairProposals.findById(proposalId)
  const project = proposal === null ? null : ctx.projects.findById(proposal.projectId)
  if (project === null) return false
  return integracionAutomaticaPermitida(esRepoPropio(project.path))
}
