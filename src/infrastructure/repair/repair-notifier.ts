import type { RepairProposalRepository } from '@domain/repair/proposal-repository'
import { avisarDelMotor } from './aviso-del-motor'

/**
 * Empuja al renderer que el expediente de un proyecto se movio, a partir de la
 * PROPUESTA que se movio: el libro de vida conoce ids de propuesta, no de
 * proyecto. Traducir aqui es todo lo que hace.
 *
 * El envio en si vive en `aviso-del-motor`, porque hay un segundo emisor que no
 * tiene propuesta ninguna —el barrido de mitigados— y el golpecito es el mismo.
 */
export function createRepairNotifier(
  proposals: RepairProposalRepository
): (proposalId: string) => void {
  return (proposalId) => {
    const projectId = proposals.findById(proposalId)?.projectId
    if (projectId === undefined) return

    avisarDelMotor(projectId)
  }
}
