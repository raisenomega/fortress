import type { ParadaDelLazo } from '@domain/repair/lazo-del-motor'
import type { JudgeResult } from './judge-and-integrate'

export interface DesenlaceDelLazo {
  readonly juicio: JudgeResult
  /** Vueltas que dio EL LAZO: la primera corrida del generador no es suya. */
  readonly vueltas: number
  /** Por que no se dio otra vuelta. `paso-fallido` no es una parada del lazo: es
   *  que el generador, el gate o el revisor cortaron, y su motivo va en `cortado`. */
  readonly parada: ParadaDelLazo | 'paso-fallido'
  /** El motivo del paso que corto, cuando lo que paro el lazo fue un fallo del
   *  camino y no una de sus paradas. */
  readonly cortado?: string
  /**
   * La ULTIMA sesion vista. `--fork-session` abre una nueva en cada vuelta, asi
   * que el lazo la recaptura y no reusa la primera; sacarla aqui es lo que hace
   * esa recaptura observable —con el tope en 2 solo hay una vuelta extra, y sin
   * este campo el mecanismo no se podria probar hasta que el tope subiera—.
   */
  readonly sesion: string | null
}

/** El eje que dispara el lazo, del veredicto que acaba de darse. */
export function resuelve(juicio: JudgeResult): 'SI' | 'NO' | 'PARCIAL' {
  return juicio.omega.ok ? juicio.omega.verdict.resuelve_el_hallazgo : 'NO'
}
