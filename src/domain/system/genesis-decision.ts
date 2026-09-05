/**
 * Por que se detiene el bucle de genesis. La UI lo traduce. El orden de
 * `genesisStop` es la prioridad de seguridad: la intervencion humana y los topes
 * mandan sobre seguir entrenando. Es el unico sitio que decide parar.
 */
export type GenesisStopReason =
  'detenido' | 'tope-diario' | 'tope-gasto' | 'tope-episodios' | 'sin-trabajo'

export interface GenesisState {
  /** El humano intervino (toggle OFF / boton Detener). Manda sobre todo. */
  readonly cancelled: boolean
  /** El tope de gasto del DIA, ya alcanzado. Manda sobre el de la sesion: el de
   *  sesion vuelve a cero en cada encendido y el del dia no, asi que sin este
   *  bastaba con reiniciar genesis para volver a gastar. */
  readonly topeDiario: boolean
  /** Gasto acumulado de la sesion de genesis, en dolares. */
  readonly spentSession: number
  readonly costCap: number
  /** Episodios corridos en esta sesion. */
  readonly episodesDone: number
  readonly maxEpisodes: number
  /** Quedan capacidades no-oficiales por avanzar. */
  readonly hasWork: boolean
}

export function genesisStop(state: GenesisState): GenesisStopReason | null {
  if (state.cancelled) return 'detenido'
  if (state.topeDiario) return 'tope-diario'
  if (state.spentSession >= state.costCap) return 'tope-gasto'
  if (state.episodesDone >= state.maxEpisodes) return 'tope-episodios'
  if (!state.hasWork) return 'sin-trabajo'
  return null
}
