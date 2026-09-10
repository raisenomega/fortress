import type { ScanHistoryRepository } from '@domain/scan/scan-history-repository'
import { SCORE_PROVISIONAL } from '@domain/scan/scan-history-repository'
import { newId } from '@domain/shared/id'
import type { Db } from './database'
import { toRecord, type ScanRow } from './scan-row'
import { SCAN_SQL } from './scan-sql'

export function createSqliteScanHistoryRepository(db: Db): ScanHistoryRepository {
  const insert = db.prepare(SCAN_SQL.INSERT)
  const insertAbierto = db.prepare(SCAN_SQL.INSERT_ABIERTO)
  const cerrarFila = db.prepare(SCAN_SQL.CERRAR)
  const byProject = db.prepare(SCAN_SQL.BY_PROJECT)
  const since = db.prepare(SCAN_SQL.SINCE)

  return {
    record: (scan) => {
      const id = newId()
      insert.run({ id, ...scan })
      return { id, ...scan }
    },

    abrir: (apertura) => {
      const id = newId()
      insertAbierto.run({ id, score: SCORE_PROVISIONAL, ...apertura })
      return {
        id,
        projectId: apertura.projectId,
        score: SCORE_PROVISIONAL,
        findingCount: 0,
        dossierCount: 0,
        criticalCount: 0,
        durationMs: 0,
        at: apertura.startedAt,
        estado: 'ABIERTO',
        startedAt: apertura.startedAt,
        paradasTotal: apertura.paradasTotal,
        paradasHechas: null,
        ficherosTotal: apertura.ficherosTotal,
        ficherosCubiertos: null,
        motivoCierre: null
      }
    },

    // `changes` y no una lectura previa: cerrar una fila que ya no existe es
    // un hecho que el UPDATE ya sabe, y preguntar antes abriria una carrera.
    cerrar: (scanId, cierre) => cerrarFila.run({ id: scanId, ...cierre }).changes > 0,

    listByProject: (projectId, limit) =>
      (byProject.all(projectId, limit) as ScanRow[]).map(toRecord),

    listSince: (from) => (since.all(from) as ScanRow[]).map(toRecord)
  }
}
