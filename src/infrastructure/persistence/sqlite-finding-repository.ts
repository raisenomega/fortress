import type { FindingRepository } from '@domain/project/finding-repository'
import { EMPTY_COUNTS, type SeverityCounts } from '@domain/project/severity-counts'
import { isSeverity, type Severity } from '@domain/shared/severity'
import type { Db } from './database'
import { toHistoria, type HistoriaRow } from './finding-historia-row'
import { toMemory, type MemoryRow } from './finding-memory-row'
import { toFinding, toInsert, type FindingRow } from './finding-row'
import * as SQL from './finding-sql'
import { createFusionPorJuicio } from './finding-fusion-por-juicio'
import { createFindingWrites } from './finding-writes'
import { createMemoriaDelTerminal } from './memoria-del-terminal'

interface CountRow {
  readonly project_id: string
  readonly severity: string
  readonly total: number
}

/** Todas las consultas van parametrizadas: nunca se concatena input. */
export function createSqliteFindingRepository(db: Db): FindingRepository {
  const byProject = db.prepare(SQL.SELECT_BY_PROJECT)
  const memoryOf = db.prepare(SQL.SELECT_MEMORY)
  const historiaOf = db.prepare(SQL.SELECT_HISTORIA)
  const counts = db.prepare(SQL.COUNTS_BY_PROJECT)
  const writes = createFindingWrites(db)

  return {
    listByProject: (projectId) => (byProject.all(projectId) as FindingRow[]).map(toFinding),

    listMemory: (projectId) => (memoryOf.all(projectId) as MemoryRow[]).map(toMemory),

    listHistoria: (projectId) => (historiaOf.all(projectId) as HistoriaRow[]).map(toHistoria),

    countsByProject: () => {
      const totals: Record<string, Record<Severity, number>> = {}
      for (const row of counts.all() as CountRow[]) {
        if (!isSeverity(row.severity)) continue
        totals[row.project_id] ??= { ...EMPTY_COUNTS }
        totals[row.project_id][row.severity] = row.total
      }
      return totals as Readonly<Record<string, SeverityCounts>>
    },

    syncFromScan: (projectId, scanId, findings, at, conservados) => {
      const dismissed = writes.dismissedFingerprints(projectId)

      writes.sync(
        projectId,
        findings.map((finding) => toInsert(projectId, scanId, finding, dismissed, at)),
        conservados ?? new Set()
      )
    },

    markExtinct: (ids, at, motivo, extinguidoPor) =>
      writes.markExtinct(ids, at, motivo, extinguidoPor),
    anotarVerificacion: (findingId, note) => writes.anotarVerificacion(findingId, note),
    devolverALaCola: (findingId, note) => writes.devolverALaCola(findingId, note),
    markMitigated: (id, note, at) => writes.markMitigated(id, note, at),
    markActive: (id) => writes.markActive(id),

    fundirPorJuicio: (projectId, fusion) => createFusionPorJuicio(db).fundir(projectId, fusion),

    dismiss: (findingId) => writes.changeStatus(findingId, true),
    reopen: (findingId) => writes.changeStatus(findingId, false),

    ...createMemoriaDelTerminal(db)
  }
}
