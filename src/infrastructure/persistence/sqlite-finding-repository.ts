import type { FindingRepository } from '@domain/project/finding-repository'
import { EMPTY_COUNTS, type SeverityCounts } from '@domain/project/severity-counts'
import { isSeverity, type Severity } from '@domain/shared/severity'
import type { Db } from './database'
import { toMemory, type MemoryRow } from './finding-memory-row'
import { toFinding, toInsert, type FindingRow } from './finding-row'
import * as SQL from './finding-sql'
import { createFindingWrites } from './finding-writes'

interface CountRow {
  readonly project_id: string
  readonly severity: string
  readonly total: number
}

/** Todas las consultas van parametrizadas: nunca se concatena input. */
export function createSqliteFindingRepository(db: Db): FindingRepository {
  const byProject = db.prepare(SQL.SELECT_BY_PROJECT)
  const memoryOf = db.prepare(SQL.SELECT_MEMORY)
  const counts = db.prepare(SQL.COUNTS_BY_PROJECT)
  const writes = createFindingWrites(db)

  return {
    listByProject: (projectId) => (byProject.all(projectId) as FindingRow[]).map(toFinding),

    listMemory: (projectId) => (memoryOf.all(projectId) as MemoryRow[]).map(toMemory),

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

    markExtinct: (ids, at, motivo) => writes.markExtinct(ids, at, motivo),
    markMitigated: (id, note, at) => writes.markMitigated(id, note, at),
    markActive: (id) => writes.markActive(id),

    dismiss: (findingId) => writes.changeStatus(findingId, true),
    reopen: (findingId) => writes.changeStatus(findingId, false)
  }
}
