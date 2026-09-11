import { SCAN_COLUMNS, SCAN_COLUMNS_BASE } from './scan-row'

/**
 * El SQL del historico de escaneos. Aparte del repositorio por lo mismo que
 * `finding-sql`: leer la forma de una consulta y leer el cableado son dos
 * lecturas distintas, y juntas no caben en un archivo.
 */
export const SCAN_SQL = {
  /** Escaneo de una pieza: solo las ocho de siempre. Las del recorrido se
   *  quedan con su default —`estado` CERRADO— porque no hay recorrido. */
  INSERT: `INSERT INTO scans (${SCAN_COLUMNS_BASE})
     VALUES (@id, @projectId, @score, @findingCount, @dossierCount, @criticalCount, @durationMs, @at)`,

  /**
   * La fila nace ABIERTA: sabe cuando empezo y cuanto tiene por delante, y nada
   * mas. Los conteos van a cero y la duracion tambien —todavia no hay nada que
   * contar— y el score al provisional que le pasa el dominio. Lo que dice que
   * ese cero no es una medida es `estado`, no el numero.
   *
   * `at` se siembra con `startedAt` para que la fila no quede sin fecha
   * mientras corre; el cierre lo pisa con la hora real de cierre.
   */
  INSERT_ABIERTO: `INSERT INTO scans
     (id, project_id, score, finding_count, dossier_count, critical_count, duration_ms, at,
      estado, started_at, paradas_total, ficheros_total)
     VALUES (@id, @projectId, @score, 0, 0, 0, 0, @startedAt,
      'ABIERTO', @startedAt, @paradasTotal, @ficherosTotal)`,

  /** `at` pasa a ser la hora del CIERRE, que es lo que siempre significo. */
  CERRAR: `UPDATE scans SET
       estado = @estado, score = @score, finding_count = @findingCount,
       dossier_count = @dossierCount, critical_count = @criticalCount,
       duration_ms = @durationMs, paradas_hechas = @paradasHechas,
       ficheros_cubiertos = @ficherosCubiertos, motivo_cierre = @motivoCierre,
       modulos = @modulos, at = @at
     WHERE id = @id`,

  BY_PROJECT: `SELECT ${SCAN_COLUMNS} FROM scans WHERE project_id = ? ORDER BY at DESC LIMIT ?`,

  SINCE: `SELECT ${SCAN_COLUMNS} FROM scans WHERE at >= ? ORDER BY at ASC`
} as const
