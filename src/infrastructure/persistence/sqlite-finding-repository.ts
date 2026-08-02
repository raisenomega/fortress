import type { FindingRepository } from '@domain/project/finding-repository'
import { EMPTY_COUNTS, type SeverityCounts } from '@domain/project/severity-counts'
import { nowIso } from '@domain/shared/id'
import { isSeverity, type Severity } from '@domain/shared/severity'
import type { Db } from './database'
import { toFinding, toInsert, type FindingInsert, type FindingRow } from './finding-row'

const COLUMNS = 'id, project_id, severity, title, file, line'

/** Lo urgente arriba: el operador lee la tabla de arriba abajo. */
const BY_URGENCY = `CASE severity
  WHEN 'CRITICAL' THEN 0 WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, file, line`

interface CountRow {
  readonly project_id: string
  readonly severity: string
  readonly total: number
}

/** Todas las consultas van parametrizadas: nunca se concatena input. */
export function createSqliteFindingRepository(db: Db): FindingRepository {
  const selectByProject = db.prepare(
    `SELECT ${COLUMNS} FROM findings WHERE project_id = ? ORDER BY ${BY_URGENCY}`
  )
  const selectCounts = db.prepare(
    'SELECT project_id, severity, COUNT(*) AS total FROM findings GROUP BY project_id, severity'
  )
  const deleteByProject = db.prepare('DELETE FROM findings WHERE project_id = ?')
  const insert = db.prepare(
    `INSERT INTO findings (id, project_id, severity, title, file, line, created_at)
     VALUES (@id, @projectId, @severity, @title, @file, @line, @createdAt)`
  )

  // Borrar e insertar tiene que ser indivisible: a medio camino el proyecto se
  // quedaria sin hallazgos y pareceria limpio.
  const replace = db.transaction((projectId: string, rows: readonly FindingInsert[]) => {
    deleteByProject.run(projectId)
    rows.forEach((row) => insert.run(row))
  })

  return {
    listByProject: (projectId) => (selectByProject.all(projectId) as FindingRow[]).map(toFinding),

    countsByProject: () => {
      const counts: Record<string, Record<Severity, number>> = {}
      for (const row of selectCounts.all() as CountRow[]) {
        if (!isSeverity(row.severity)) continue
        counts[row.project_id] ??= { ...EMPTY_COUNTS }
        counts[row.project_id][row.severity] = row.total
      }
      return counts as Readonly<Record<string, SeverityCounts>>
    },

    replaceForProject: (projectId, findings) => {
      const createdAt = nowIso()
      replace(
        projectId,
        findings.map((finding) => toInsert(projectId, finding, createdAt))
      )
    }
  }
}
