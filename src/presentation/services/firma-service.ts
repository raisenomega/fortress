import { api } from '../adapters/fortress-api'
import { reportError } from '../stores/toast-store'
import { loadRepair } from './repair-service'

/**
 * Firmar una propuesta parada en el gate: autoriza el juicio del revisor, que
 * es lo que el operador retiene cuando el motor corre hasta el gate.
 *
 * No hay "siguiente" que buscar. Al firmar, la propuesta deja GATE y sale sola
 * de la cola, asi que el relevo lo hace la relectura del expediente y la
 * cabeza de la cola pasa a ser la que sigue. Firmar dos veces la misma es
 * imposible por construccion, no por una guarda aparte.
 *
 * Vive fuera de `repair-service` por el limite de 75 lineas, y de paso queda
 * donde le toca: cargar el expediente y autorizar un juicio son dos cosas.
 */
export async function firmarPropuesta(projectId: string, proposalId: string): Promise<void> {
  try {
    const result = await api().repair.runOmega(proposalId)
    if (!result.ok) reportError(`OMEGA: ${result.reason}`)
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al firmar la propuesta')
  } finally {
    await loadRepair(projectId)
  }
}
