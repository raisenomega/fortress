import type { ProposalState } from '@domain/repair/proposal'

/** Los dos estados en los que la propuesta espera un acto del operador. */
const FIRMABLES: ReadonlySet<ProposalState> = new Set(['GATE', 'OMEGA'])

export function esFirmable(state: ProposalState): boolean {
  return FIRMABLES.has(state)
}

/**
 * Como se llama el acto AQUI. Un boton, dos nombres, porque son dos actos y
 * solo uno toca el arbol vivo.
 *
 * Los dos se llamaron "Firmar" un tiempo, con el argumento de que para el
 * operador es la misma decision —"adelante con esta"—. El argumento no
 * aguanta: en GATE el revisor no ha hablado todavia y pulsar solo le pide una
 * opinion, que no mueve el repo; en OMEGA ya juzgo a favor y pulsar INTEGRA.
 * Un nombre comun para las dos entrena a pulsar sin mirar el estado, que es
 * justo lo contrario de para lo que existe la firma.
 */
export function nombreDelActo(state: ProposalState): string {
  return state === 'GATE' ? 'Pedir revision' : 'Firmar'
}

/** Lo que el nombre corto no cabe a decir: que pasa exactamente al pulsar. */
export function queFirma(state: ProposalState): string {
  if (state === 'GATE') return 'Pedir revision: corre el revisor. No integra nada todavia'
  return 'Firmar: integra el fix al repo'
}
