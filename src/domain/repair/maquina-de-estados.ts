import type { ProposalState } from './proposal'

/** A donde puede ir cada estado. CADUCADO es la salida de emergencia de todos
 *  los vivos: base movida, analisis obsoleto o re-validacion fallida. ELEGIDO
 *  puede acabar en RECHAZADO sin pasar por ANALIZADO: el analista corrio y su
 *  salida no se dejo leer, que no es caducar. */
const NEXT: Readonly<Record<ProposalState, readonly ProposalState[]>> = {
  ELEGIDO: ['ANALIZADO', 'RECHAZADO', 'CADUCADO'],
  ANALIZADO: ['GENERADO', 'RECHAZADO', 'CADUCADO'],
  GENERADO: ['GATE', 'RECHAZADO', 'CADUCADO'],
  GATE: ['OMEGA', 'RECHAZADO', 'CADUCADO'],
  // OMEGA -> GENERADO es la arista del LAZO (ADR-110 §3) y la UNICA que vuelve
  // atras: un PARCIAL aprobado manda otra vuelta al generador, que vuelve a
  // dejar la propuesta en GENERADO. Ni al gate ni al analisis se vuelve, y
  // CUANTAS vueltas se dan no lo decide esta tabla —dice lo estructuralmente
  // posible—: lo decide el lazo, con la huella y su tope.
  OMEGA: ['APROBADO', 'RECHAZADO', 'CADUCADO', 'GENERADO'],
  APROBADO: ['MERGEADO', 'CADUCADO'],
  MERGEADO: [],
  RECHAZADO: [],
  CADUCADO: []
}

/** Regla pura: toda transicion se valida aqui antes de persistirse. */
export function canTransition(from: ProposalState, to: ProposalState): boolean {
  return NEXT[from].includes(to)
}

/**
 * Un estado es TERMINAL cuando no tiene salida: la propuesta murio ahi. Se
 * DERIVA de la tabla de transiciones, no se declara aparte — una segunda lista
 * del mismo concepto envejeceria por su cuenta (ADR-059).
 */
export function isTerminal(state: ProposalState): boolean {
  return NEXT[state].length === 0
}

/** Los terminales enumerados, para las consultas que necesitan listarlos. */
export const TERMINAL_STATES: readonly ProposalState[] = (
  Object.keys(NEXT) as ProposalState[]
).filter(isTerminal)
