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

/** Veredicto de C2: REAL (accionable) u OBSOLETO (el problema ya no existe). */
export type AnalysisVerdict = 'REAL' | 'OBSOLETO'

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
 *  los vivos: base movida, analisis obsoleto o re-validacion fallida. */
const NEXT: Readonly<Record<ProposalState, readonly ProposalState[]>> = {
  ELEGIDO: ['ANALIZADO', 'CADUCADO'],
  ANALIZADO: ['GENERADO', 'RECHAZADO', 'CADUCADO'],
  GENERADO: ['GATE', 'CADUCADO'],
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
