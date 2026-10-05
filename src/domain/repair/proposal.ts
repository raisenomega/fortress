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
 * Cada uno nacio de una confusion real: sin ILEGIBLE un fallo de lectura caia
 * en OBSOLETO y el motor afirmaba que el hallazgo no existia sin saberlo; sin
 * NO_ARRANCO un PATH roto se registraba como una mala contestacion del modelo,
 * porque ILEGIBLE supone que hubo respuesta y aqui no hubo proceso.
 */
export type AnalysisVerdict = 'REAL' | 'OBSOLETO' | 'ILEGIBLE' | 'NO_ARRANCO' | 'PROVEEDOR'

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

/**
 * La maquina de estados sale a su modulo —el fichero paso de 75 al documentar la
 * arista del lazo— y se RE-EXPORTA aqui a proposito: `proposal` sigue siendo la
 * puerta del expediente, y sus diecisiete importadores no tienen por que saber
 * que la tabla cambio de casa.
 */
export { canTransition, isTerminal, TERMINAL_STATES } from './maquina-de-estados'
