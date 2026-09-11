import { aEstadoScan } from '@domain/scan/estado-scan'
import type { ScanRecord } from '@domain/scan/scan-record'

/** Las columnas de `scans`, en un solo sitio: el insert y los selects las comparten. */
export const SCAN_COLUMNS =
  'id, project_id, score, finding_count, dossier_count, critical_count, duration_ms, at, ' +
  'estado, started_at, paradas_total, paradas_hechas, ficheros_total, ficheros_cubiertos, motivo_cierre, modulos' // prettier-ignore

/** Las ocho de siempre: lo que escribe un escaneo de una pieza. */
export const SCAN_COLUMNS_BASE =
  'id, project_id, score, finding_count, dossier_count, critical_count, duration_ms, at'

export interface ScanRow {
  readonly id: string
  readonly project_id: string
  readonly score: number
  readonly finding_count: number
  readonly dossier_count: number
  readonly critical_count: number
  readonly duration_ms: number
  readonly at: string
  readonly estado: string
  readonly started_at: string | null
  readonly paradas_total: number | null
  readonly paradas_hechas: number | null
  readonly ficheros_total: number | null
  readonly ficheros_cubiertos: number | null
  readonly motivo_cierre: string | null
  readonly modulos: string | null
}

/**
 * La fila como la entiende el dominio. `estado` pasa por el vocabulario: la
 * columna no lleva CHECK —SQLite no lo admite en un ALTER— asi que quien valida
 * es el dominio al leer, igual que hace `findings.status`.
 */
export function toRecord(row: ScanRow): ScanRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    score: row.score,
    findingCount: row.finding_count,
    dossierCount: row.dossier_count,
    criticalCount: row.critical_count,
    durationMs: row.duration_ms,
    at: row.at,
    estado: aEstadoScan(row.estado),
    startedAt: row.started_at,
    paradasTotal: row.paradas_total,
    paradasHechas: row.paradas_hechas,
    ficherosTotal: row.ficheros_total,
    ficherosCubiertos: row.ficheros_cubiertos,
    motivoCierre: row.motivo_cierre,
    modulos: row.modulos
  }
}
