import { isTerminal, type ProposalState } from '@domain/repair/proposal'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { advanceProposal } from './advance-proposal'
import { cursorFrom } from './book-cursor'

/** El motivo que el operador escribio, o la constancia de que no escribio ninguno. */
const porQue = (motivo: string | undefined, state: ProposalState): string =>
  motivo === undefined || motivo.trim() === ''
    ? `sin motivo escrito, desde ${state}`
    : motivo.trim()

/**
 * La salida que a una propuesta viva le faltaba. Hasta ahora solo se podia
 * avanzar: firmar, reintentar, dejar que el motor la caducara. Una que no
 * admitiera ninguna de las tres —un veredicto que la firma rechaza, un proyecto
 * borrado bajo sus pies— se quedaba viva para siempre, y de paso su hallazgo
 * fuera de la cola, porque un hallazgo con propuesta viva no se re-elige.
 *
 * CADUCADO y no RECHAZADO, y la diferencia importa dos veces. RECHAZADO esta
 * reservado al juicio de una maquina —el gate, OMEGA, el generador— y aqui no
 * juzgo ninguna; ademas `hasBlockingRejection` lo leeria como un rechazo no
 * reintentable y dejaria el hallazgo BLOQUEADO, que es lo contrario de lo que
 * se busca. CADUCADO es lo que el dominio llama "la salida de emergencia de
 * todos los vivos", y libera el hallazgo por la primera linea de esa regla.
 *
 * El estado dice que murio; la razon dice quien la mato. Por eso el motivo
 * viaja en el texto y no en un estado nuevo.
 *
 * NO se pide ni el proyecto ni el hallazgo. Retirar tiene que funcionar
 * justamente cuando ya no estan: hay una propuesta de agosto en ANALIZADO cuyo
 * proyecto se borro debajo, y ninguna accion del motor puede tocarla porque
 * todas empiezan resolviendo el proyecto.
 *
 * Y NO dispone del hallazgo. Que vuelva a la cola es consecuencia de que su
 * propuesta deje de ser viva; decidir que el hallazgo tampoco procede es otro
 * acto, y ya tiene su sitio en el Escaneo (`scan:dismiss`).
 */
export async function retirarPropuesta(
  ctx: AppContext,
  proposalId: string,
  motivo?: string
): Promise<Result<null>> {
  const proposal = ctx.repairProposals.findById(proposalId)
  if (proposal === null) return err('Esa propuesta ya no existe')
  if (isTerminal(proposal.state)) return err(`Esa propuesta ya murio en ${proposal.state}`)

  const razon = porQue(motivo, proposal.state)
  const cursor = cursorFrom(await ctx.eventLog.list(proposalId))
  const texto = `retirada por el operador: ${razon}`
  await advanceProposal(ctx, proposal, ['CADUCADO'], texto, cursor, Date.now())

  ctx.omegaLog.append({
    projectId: proposal.projectId,
    agentId: null,
    kind: 'nota',
    verdict: 'info',
    summary: `Propuesta ${proposalId.slice(0, 8)} retirada desde ${proposal.state}.`,
    evidence: razon
  })
  return ok(null)
}
