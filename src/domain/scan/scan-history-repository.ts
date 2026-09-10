import type { EstadoFinal } from './estado-scan'
import type { NewScanRecord, ScanRecord } from './scan-record'

/**
 * El score de una fila recien abierta. Cero y no cien: un escaneo a medias no
 * puede presumir de nota, y es la misma regla que ya sigue el score integral
 * ("sin datos NO cuenta como 100"). Quien lo lee sabe que es provisional
 * porque el ESTADO lo dice, no porque el numero se lo insinue.
 */
export const SCORE_PROVISIONAL = 0

/** Lo que se sabe al ABRIR: cuando empieza y cuanto hay que mirar. */
export interface AperturaDeScan {
  readonly projectId: string
  readonly startedAt: string
  readonly paradasTotal: number
  readonly ficherosTotal: number
}

/** Lo que se sabe al CERRAR: el score deja de ser provisional. */
export interface CierreDeScan {
  readonly estado: EstadoFinal
  readonly score: number
  readonly findingCount: number
  readonly dossierCount: number
  readonly criticalCount: number
  readonly durationMs: number
  readonly paradasHechas: number
  readonly ficherosCubiertos: number
  readonly motivoCierre: string
  readonly at: string
}

/**
 * Puerto del historico de escaneos. Deja de ser append-only con ADR-082: un
 * recorrido por paradas abre la fila antes de mirar nada y la cierra al final,
 * asi que el historico tiene que saber ACTUALIZAR una fila suya.
 *
 * `record` se queda tal cual para el escaneo de una pieza, que es el unico que
 * existe hoy: cablear las paradas es otro cambio.
 */
export interface ScanHistoryRepository {
  /** Escaneo de una pieza: nace y muere en la misma llamada, ya CERRADO. */
  record(scan: NewScanRecord): ScanRecord
  /** Abre la fila ANTES de escanear: estado ABIERTO y score provisional. */
  abrir(apertura: AperturaDeScan): ScanRecord
  /** Fija los valores finales. `false` si esa fila ya no existe. */
  cerrar(scanId: string, cierre: CierreDeScan): boolean
  /** Del mas reciente al mas antiguo. */
  listByProject(projectId: string, limit: number): readonly ScanRecord[]
  /** Todos los proyectos a la vez, para las graficas del dashboard. */
  listSince(since: string): readonly ScanRecord[]
}
