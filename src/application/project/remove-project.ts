import { isTerminal } from '@domain/repair/proposal'
import { RECLAIM_REASONS } from '@domain/repair/reclaim-reasons'
import { err, ok, type Result } from '@domain/shared/result'
import type { AppContext } from '../context'
import { retirarPropuesta } from '../repair/retirar-propuesta'

/**
 * Quita un proyecto de FORTRESS. El historial de chat, los hallazgos, la
 * telemetria y las propuestas caen con el por el ON DELETE CASCADE del esquema;
 * los archivos en disco no se tocan.
 *
 * Pero la cascada BORRA EN SILENCIO, y una propuesta viva no puede morir asi:
 * cuando el proyecto se desvanece del disco, la reconciliacion de arranque la
 * caduca con razon, y el mismo hecho —este proyecto ya no esta— no puede tener
 * dos destinos segun por donde entre (ADR-059). Asi que las vivas se juzgan
 * ANTES de soltar la fila, y la cascada solo limpia lo que ya murio.
 *
 * Se delega en `retirarPropuesta` y no en `advanceProposal` a proposito: el
 * parche y el libro de eventos cuelgan de la propuesta y mueren con ella un
 * instante despues, asi que el juicio solo sobrevive si queda asentado en
 * `omega_log` —la unica tabla sin clave foranea— y ese asiento explicito lo
 * pone la retirada, no el avance. Sin el, caducar aqui seria teatro.
 */
export async function removeProject(context: AppContext, id: string): Promise<Result<null>> {
  if (!context.projects.findById(id)) {
    return err('Ese proyecto ya no existe')
  }

  // Solo las vivas. Que una terminal no se re-juzgue ya lo garantiza la propia
  // retirada, que las rechaza; el filtro esta para no recorrer el expediente
  // entero preguntando por muertas — en un proyecto veterano son casi todas.
  for (const propuesta of context.repairProposals.listByProject(id)) {
    if (!isTerminal(propuesta.state)) {
      await retirarPropuesta(context, propuesta.id, RECLAIM_REASONS.PROYECTO_RETIRADO)
    }
  }

  context.projects.remove(id)
  return ok(null)
}
