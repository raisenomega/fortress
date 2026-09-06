import type { Proposal } from '@domain/repair/proposal'
import { api } from '../adapters/fortress-api'
import { notify, reportError } from '../stores/toast-store'
import { loadRepair } from './repair-service'

interface Resultado {
  readonly fallo: string | null
  /** Si el arbol vivo del proyecto cambio. Se LEE de lo que paso, no se deduce
   *  del estado en el que estaba la propuesta antes de pulsar. */
  readonly integrada: boolean
}

/** Lo que la firma hace segun donde este parada la propuesta. */
async function autorizar(proposal: Proposal): Promise<Resultado> {
  if (proposal.state === 'GATE') {
    const juicio = await api().repair.runOmega(proposal.id)
    return { fallo: juicio.ok ? null : `OMEGA: ${juicio.reason}`, integrada: juicio.integrada }
  }
  const merge = await api().repair.sign(proposal.id)
  const fallo = merge.applied ? null : (merge.reason ?? 'no se pudo integrar')
  return { fallo, integrada: merge.applied }
}

/**
 * Firmar una propuesta parada en el gate: autoriza el juicio del revisor, que
 * es lo que el operador retiene cuando el motor corre hasta el gate.
 *
 * Dos actos con un solo boton, porque para el operador es la misma decision
 * —"adelante con esta"— y lo que cambia es donde estaba parada.
 *
 * En GATE autoriza el juicio, y ese juicio PUEDE arrastrar la integracion
 * detras si la politica del proyecto la permite. Sobre el codigo propio de
 * FORTRESS no: ahi juzga y para, y la integracion pide su propia firma —esta
 * misma, con la propuesta ya en OMEGA—. Este parrafo decia que en GATE solo se
 * autorizaba el juicio, y era falso: integraba, sin decirlo.
 *
 * Por eso el aviso ya no mira el estado ANTERIOR. Preguntaba "estaba en OMEGA?"
 * para decidir si anunciar la integracion, asi que la integracion que salia de
 * GATE ocurria en silencio. Ahora se anuncia lo que el main dice que paso.
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
    const { fallo, integrada } = await autorizar(proposal)
    if (fallo !== null) reportError(fallo)
    else if (integrada) notify('Integrada. El repo ya lleva el fix.', 'ok')
  } catch (error) {
    reportError(error instanceof Error ? error.message : 'Fallo al firmar la propuesta')
  } finally {
    await loadRepair(proposal.projectId)
  }
}
