import type { ParadaRun } from '@domain/telemetry/parada-run'
import type { ParadaRunRepository } from '@domain/telemetry/parada-run-repository'
import { newId } from '@domain/shared/id'
import type { Db } from './database'
import { usageFromRow, type UsageColumns } from './usage-row'

const COLUMNS = `id, scan_id, project_id, parada_indice, parada_rotulo, duration_ms,
  input_tokens, output_tokens, cache_read_tokens, cache_creation_tokens, cost_usd, num_turns, at`

const INSERT = `INSERT INTO scan_parada_runs (${COLUMNS})
  VALUES (@id, @scanId, @projectId, @paradaIndice, @paradaRotulo, @durationMs,
  @inputTokens, @outputTokens, @cacheReadTokens, @cacheCreationTokens, @costUsd,
  @numTurns, @at)`

/** En el orden del RECORRIDO, no por hora: es lo que la hace legible como serie. */
const BY_SCAN = `SELECT ${COLUMNS} FROM scan_parada_runs
  WHERE scan_id = ? ORDER BY parada_indice ASC`

type Row = UsageColumns & {
  id: string
  scan_id: string
  project_id: string
  parada_indice: number
  parada_rotulo: string
  duration_ms: number
  at: string
}

const toRun = (row: Row): ParadaRun => ({
  id: row.id,
  scanId: row.scan_id,
  projectId: row.project_id,
  paradaIndice: row.parada_indice,
  paradaRotulo: row.parada_rotulo,
  durationMs: row.duration_ms,
  usage: usageFromRow(row),
  at: row.at
})

/** Todas las consultas parametrizadas: nunca se concatena input. */
export function createSqliteParadaRunRepository(db: Db): ParadaRunRepository {
  const insert = db.prepare(INSERT)
  const byScan = db.prepare(BY_SCAN)

  return {
    record: (run) => {
      const id = newId()
      insert.run({ id, ...run, ...run.usage })
      return { id, ...run }
    },
    listByScan: (scanId) => (byScan.all(scanId) as Row[]).map(toRun)
  }
}
