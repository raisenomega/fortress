import type { ProposalState } from '@domain/repair/proposal'

/** Los dos estados en los que la propuesta espera un acto del operador. */
const FIRMABLES: ReadonlySet<ProposalState> = new Set(['GATE', 'OMEGA'])

export function esFirmable(state: ProposalState): boolean {
  return FIRMABLES.has(state)
}

/**
 * Que autoriza la firma AQUI. Un solo boton para los dos estados —para el
 * operador es la misma decision, "adelante con esta"— pero no el mismo acto:
 * en GATE el revisor aun no ha hablado y firmar autoriza su juicio; en OMEGA ya
 * juzgo a favor y firmar integra al repo. Decir solo "Firmar" en los dos sitios
 * dejaria al operador sin saber si esta soltando un fix o pidiendo una opinion.
 */
export function queFirma(state: ProposalState): string {
  if (state === 'GATE') return 'Firmar: autoriza el juicio del revisor, que aun no ha corrido'
  return 'Firmar: integra el fix al repo'
}
