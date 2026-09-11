import type { NewParadaRun, ParadaRun } from './parada-run'

/**
 * Puerto de la telemetria por parada. Deliberadamente pequeño: anexa y lee una
 * serie, y nada mas. No tiene agregados a proposito —quien quiera sumar que
 * sume la serie— porque el sitio donde se suman corridas es `agent_runs`, y
 * duplicar ahi la aritmetica seria invitar a que los dos totales discrepen.
 */
export interface ParadaRunRepository {
  record(run: NewParadaRun): ParadaRun
  /** La serie de un escaneo, en el orden en que se recorrio. */
  listByScan(scanId: string): readonly ParadaRun[]
}
