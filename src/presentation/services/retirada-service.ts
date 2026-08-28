import type { Proposal } from '@domain/repair/proposal'
import { api } from '../adapters/fortress-api'
import { notify, reportError } from '../stores/toast-store'
import { loadRepair } from './repair-service'

/**
 * Retirar una propuesta: el operador la caduca porque no procede seguir con
 * ella. Es la unica salida de una que no se puede firmar ni reintentar.
 *
 * No hay "siguiente" que buscar ni nada que esconder a mano: la propuesta pasa a
 * terminal y sale sola del expediente y de la cola de firma, asi que el relevo
 * lo hace la relectura. Retirar dos veces la misma es imposible por
 * construccion — el caso de uso rechaza lo ya terminal.
 *
 * Vive fuera de `repair-service` por el limite de 75 lineas, igual que la firma,
 * y por el mismo motivo de fondo: leer el expediente y decidir sobre una
 * propuesta son dos cosas distintas.
 */
export async function retirarPropuesta(proposal: Proposal, motivo: string): Promise<void> {
  try {
    const result = await api().repair.withdraw(proposal.id, motivo.trim() || undefined)
    if (result.ok) notify('Propuesta retirada. Su hallazgo vuelve a la cola.', 'ok')
    else reportError(result.error)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al retirar la propuesta')
  } finally {
    await loadRepair(proposal.projectId)
  }
}
