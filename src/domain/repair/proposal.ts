/**
 * Expediente de una reparacion del motor disciplinado: la maquina de estados
 * COMPLETA queda declarada desde I1, aunque cada incremento solo transite su
 * tramo (I1 ejerce ELEGIDO -> ANALIZADO | CADUCADO). Los estados terminales
 * no salen: una propuesta muerta no resucita, se abre otra.
 */
export type ProposalState =
  | 'ELEGIDO'
  | 'ANALIZADO'
  | 'GENERADO'
  | 'GATE'
  | 'OMEGA'
  | 'APROBADO'
  | 'RECHAZADO'
  | 'MERGEADO'
  | 'CADUCADO'

/**
 * Veredicto de C2. Tres, no dos: REAL (accionable), OBSOLETO (el problema ya no
 * existe) e ILEGIBLE (el analista dictamino, pero su salida no se dejo leer).
 *
 * ILEGIBLE existe porque sin el, un fallo de lectura caia por el lado de
 * OBSOLETO y el motor afirmaba que el hallazgo no existia sin haber llegado a
 * saberlo. Ademas es lo que mira el descuento por base_sha, que solo silencia
 * al hallazgo cuando el veredicto es OBSOLETO de verdad.
 */
export type AnalysisVerdict = 'REAL' | 'OBSOLETO' | 'ILEGIBLE'

export interface Proposal {
  readonly id: string
  readonly projectId: string
  readonly findingId: string
  /** HEAD del repo al elegir: el ancla contra la que se generara y mergeara. */
  readonly baseSha: string
  readonly state: ProposalState
  readonly analysisVerdict?: AnalysisVerdict
  readonly analysisReason?: string
  readonly createdAt: number
  readonly updatedAt: number
}

/** A donde puede ir cada estado. CADUCADO es la salida de emergencia de todos
 *  los vivos: base movida, analisis obsoleto o re-validacion fallida. ELEGIDO
 *  puede acabar en RECHAZADO sin pasar por ANALIZADO: el analista corrio y su
 *  salida no se dejo leer, que no es caducar. */
const NEXT: Readonly<Record<ProposalState, readonly ProposalState[]>> = {
  ELEGIDO: ['ANALIZADO', 'RECHAZADO', 'CADUCADO'],
  ANALIZADO: ['GENERADO', 'RECHAZADO', 'CADUCADO'],
  GENERADO: ['GATE', 'RECHAZADO', 'CADUCADO'],
  GATE: ['OMEGA', 'RECHAZADO', 'CADUCADO'],
  OMEGA: ['APROBADO', 'RECHAZADO', 'CADUCADO'],
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
