import type { EstadoScan } from './estado-scan'

/** Un escaneo. Se guardan todos: la tendencia necesita historia. */
export interface ScanRecord {
  readonly id: string
  readonly projectId: string
  readonly score: number
  /** Los que la corrida REPORTO. No es lo que puntua el score. */
  readonly findingCount: number
  /**
   * Sobre cuantos hallazgos se calculo el score: los reportados MAS los que
   * seguian vivos sin que este escaneo los nombrara. Es lo que hace legible un
   * "score 0 con 4 hallazgos" — el 0 sale de setenta y dos, no de cuatro.
   * Cero en las filas anteriores a que esto se guardara: no consta.
   */
  readonly dossierCount: number
  readonly criticalCount: number
  readonly durationMs: number
  readonly at: string
  /**
   * Los campos del recorrido por paradas (ADR-082). Opcionales porque un
   * escaneo de una sola pieza no tiene paradas que contar, y las 50 filas
   * anteriores tampoco: ausente es "no consta", no cero.
   */
  readonly estado?: EstadoScan
  /** Cuando empezo. Antes solo se guardaba `at`, que es el CIERRE. */
  readonly startedAt?: string | null
  readonly paradasTotal?: number | null
  readonly paradasHechas?: number | null
  /** La cobertura declarada: `cubiertos` de `total`. */
  readonly ficherosTotal?: number | null
  readonly ficherosCubiertos?: number | null
  /** Por que dejo de correr. Null mientras sigue ABIERTO. */
  readonly motivoCierre?: string | null
}

export type NewScanRecord = Omit<ScanRecord, 'id'>
