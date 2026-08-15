import type { ProposalEventLog } from '@application/repair/proposal-event-log'
import type { ProposalEventRepository } from '@domain/repair/proposal-event-repository'

/**
 * El puerto asincrono de aplicacion, envolviendo el repositorio sincrono.
 *
 * `onRecorded` avisa de que el expediente de una propuesta se movio. Va AQUI y
 * no en cada fase del motor porque todas escriben por este mismo sitio: un solo
 * punto en vez de un aviso enhebrado por cinco casos de uso, que ademas seria
 * cinco sitios donde olvidarse.
 *
 * El aviso jamas rompe el asiento: avisar es cortesia para la pantalla; asentar
 * es el libro.
 */
export function createProposalEventLog(
  repo: ProposalEventRepository,
  onRecorded: (proposalId: string) => void = () => {}
): ProposalEventLog {
  return {
    record: (event) => {
      repo.append(event)
      try {
        onRecorded(event.proposalId)
      } catch (error) {
        console.error('[motor] fallo al avisar del asiento', event.proposalId, error)
      }
      return Promise.resolve()
    },
    list: (proposalId) => Promise.resolve(repo.listByProposal(proposalId))
  }
}
