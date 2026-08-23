import type { Proposal } from '@domain/repair/proposal'
import { api } from '../adapters/fortress-api'
import { notify, reportError } from '../stores/toast-store'
import { loadRepair } from './repair-service'

/** Lo que la firma hace segun donde este parada la propuesta. */
async function autorizar(proposal: Proposal): Promise<string | null> {
  if (proposal.state === 'GATE') {
    const juicio = await api().repair.runOmega(proposal.id)
    return juicio.ok ? null : `OMEGA: ${juicio.reason}`
  }
  const merge = await api().repair.sign(proposal.id)
  return merge.applied ? null : (merge.reason ?? 'no se pudo integrar')
}

/**
 * Firmar una propuesta parada en el gate: autoriza el juicio del revisor, que
 * es lo que el operador retiene cuando el motor corre hasta el gate.
 *
 * Dos actos con un solo boton, porque para el operador es la misma decision
 * —"adelante con esta"— y lo que cambia es donde estaba parada: en GATE
 * autoriza el juicio del revisor; en OMEGA, ya juzgada, la integra al repo.
 *
 * No hay "siguiente" que buscar. Al firmar, la propuesta cambia de estado y
 * sale sola de la cola, asi que el relevo lo hace la relectura del expediente.
 * Firmar dos veces la misma es imposible por construccion.
 *
 * Vive fuera de `repair-service` por el limite de 75 lineas, y de paso queda
 * donde le toca: cargar el expediente y autorizar un juicio son dos cosas.
 */
export async function firmarPropuesta(proposal: Proposal): Promise<void> {
  try {
    const fallo = await autorizar(proposal)
    if (fallo !== null) reportError(fallo)
    else if (proposal.state === 'OMEGA') notify('Integrada. El repo ya lleva el fix.', 'ok')
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al firmar la propuesta')
  } finally {
    await loadRepair(proposal.projectId)
  }
}
