import type { FindingRepository } from '@domain/project/finding-repository'
import { EMPTY_COUNTS, type SeverityCounts } from '@domain/project/severity-counts'
import { nowIso } from '@domain/shared/id'
import { isSeverity, type Severity } from '@domain/shared/severity'
import type { Db } from './database'
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
  const counts = db.prepare(SQL.COUNTS_BY_PROJECT)
  const writes = createFindingWrites(db)

  return {
    listByProject: (projectId) => (byProject.all(projectId) as FindingRow[]).map(toFinding),

    countsByProject: () => {
      const totals: Record<string, Record<Severity, number>> = {}
      for (const row of counts.all() as CountRow[]) {
        if (!isSeverity(row.severity)) continue
        totals[row.project_id] ??= { ...EMPTY_COUNTS }
        totals[row.project_id][row.severity] = row.total
      }
      return totals as Readonly<Record<string, SeverityCounts>>
    },

    replaceForProject: (projectId, scanId, findings) => {
      const dismissed = writes.dismissedFingerprints(projectId)
      const createdAt = nowIso()

      writes.replace(
        projectId,
        findings.map((finding) => toInsert(projectId, scanId, finding, dismissed, createdAt))
      )
    },

    dismiss: (findingId) => writes.changeStatus(findingId, true),
    reopen: (findingId) => writes.changeStatus(findingId, false)
  }
}
