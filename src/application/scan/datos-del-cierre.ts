import type { SeverityCounts } from '@domain/project/severity-counts'
import type { DetectedFinding } from '@domain/scan/detected-finding'
import type { ModulosDelCierre } from '@domain/scan/modulos-del-cierre'
import type { MotivoCierre } from '@domain/scan/motivo-cierre'
import type { TokenUsage } from '@domain/telemetry/token-usage'

/**
 * Lo que hace falta para cerrar un escaneo. `reportados` es la suma de TODAS
 * las paradas, no la ultima: el score puntua el expediente entero y `ausentes`
 * necesita saber que se nombro en el recorrido completo.
 */
export interface DatosDelCierre {
  readonly scanId: string
  readonly reportados: readonly DetectedFinding[]
  readonly paradasHechas: number
  /** Las XX que el manifiesto fijo. 1 en un escaneo de una pieza. */
  readonly paradasTotal: number
  /** Null mientras no haya manifiesto que declarar. */
  readonly ficherosCubiertos: number | null
  /** La Y de «audite X de Y». Null sin manifiesto. */
  readonly ficherosTotal: number | null
  /**
   * La campana con la que este escaneo se comprometio y lo que de ella corrio
   * (ADR-083, Fase 5). Viaja hasta aqui porque el informe la TRANSCRIBE: si se
   * quedara en el manifiesto moriria al terminar el recorrido, y el entregable
   * tendria que volver a medir un arbol que ya no es el que se audito.
   */
  readonly modulos: ModulosDelCierre
  readonly motivo: MotivoCierre
  readonly at: string
  /**
   * Lo que costo AUDITAR: la suma de las paradas terminadas. Es tiempo de
   * agente, y es lo que se factura en `agent_runs`.
   */
  readonly durationMs: number
  /**
   * Lo que duro el ESCANEO, de reloj de pared: de que se abrio la fila a que se
   * cerro. Es otra cosa que `durationMs`, y la diferencia importa — un escaneo
   * que murio en su primera parada tiene CERO auditado y quince minutos
   * transcurridos, y decir que «duro 0» de algo que ardio un cuarto de hora es
   * la clase de cifra que hace dudar de todas las demas.
   */
  readonly transcurridoMs: number
  readonly usage: TokenUsage
  readonly tools: readonly string[]
  readonly edits: readonly string[]
}

/** Lo que el cierre CALCULA sobre el expediente, una vez y al final. */
export interface Calculado {
  readonly score: number
  readonly counts: SeverityCounts
  /** El expediente entero: lo reportado MAS lo que sigue vivo sin nombrarse. */
  readonly expediente: readonly DetectedFinding[]
}
