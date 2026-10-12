/**
 * Por que se detiene el LAZO CTO<->Terminal (Sello 2b). Molde de `genesisStop`:
 * el orden ES la prioridad de seguridad —la intervencion humana y los topes
 * mandan sobre seguir—. El unico sitio que decide parar el lazo. La UI traduce.
 *
 * Es OTRO lazo que el de Genesis (ese entrena agentes; este lleva PASOS del CTO
 * al Terminal y de vuelta): topes propios, etiquetados aparte en Configuracion.
 */
export type LazoStopReason = 'detenido' | 'tope-diario' | 'tope-vueltas' | 'nada-que-hacer'

export interface LazoState {
  /** El humano intervino (Detener / toggle). Manda sobre todo. */
  readonly cancelled: boolean
  /** El tope de gasto del DIA, ya alcanzado (lo cobra el gate del envio). */
  readonly topeDiario: boolean
  /** Vueltas completas (Terminal->CTO) dadas en esta sesion del lazo. */
  readonly iteraciones: number
  readonly maxIteraciones: number
  /** No quedan hallazgos vivos que reparar, o el lazo lleva rato sin actividad. */
  readonly nadaQueHacer: boolean
}

export function lazoStop(state: LazoState): LazoStopReason | null {
  if (state.cancelled) return 'detenido'
  if (state.topeDiario) return 'tope-diario'
  if (state.iteraciones >= state.maxIteraciones) return 'tope-vueltas'
  if (state.nadaQueHacer) return 'nada-que-hacer'
  return null
}
