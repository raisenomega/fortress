import { nowIso } from '@domain/shared/id'
import type { Db } from './database'
import type { FindingInsert } from './finding-row'
import * as SQL from './finding-sql'

type Located = { readonly project_id: string; readonly fingerprint: string } | undefined

export interface FindingWrites {
  replace(projectId: string, rows: readonly FindingInsert[]): void
  changeStatus(findingId: string, dismissed: boolean): boolean
  dismissedFingerprints(projectId: string): ReadonlySet<string>
}

/** Escrituras de findings. Cada una es indivisible por su cuenta. */
export function createFindingWrites(db: Db): FindingWrites {
  const removeAll = db.prepare(SQL.DELETE_BY_PROJECT)
  const insert = db.prepare(SQL.INSERT_FINDING)
  const locate = db.prepare(SQL.SELECT_FINDING)
  const setStatus = db.prepare(SQL.SET_STATUS)
  const addDismissal = db.prepare(SQL.INSERT_DISMISSAL)
  const dropDismissal = db.prepare(SQL.DELETE_DISMISSAL)
  const dismissalsOf = db.prepare(SQL.SELECT_DISMISSALS)

  // Borrar e insertar tiene que ser indivisible: a medio camino el proyecto se
  // quedaria sin hallazgos y pareceria limpio.
  const replace = db.transaction((projectId: string, rows: readonly FindingInsert[]) => {
    removeAll.run(projectId)
    rows.forEach((row) => insert.run(row))
  })

  // El estado de la fila y el registro duradero del descarte van juntos, o el
  // descarte no sobreviviria al siguiente escaneo.
  const changeStatus = db.transaction((findingId: string, dismissed: boolean) => {
    const row = locate.get(findingId) as Located
    if (!row) return false

    setStatus.run(dismissed ? 'false_positive' : 'open', findingId)
    if (dismissed) addDismissal.run(row.project_id, row.fingerprint, nowIso())
    else dropDismissal.run(row.project_id, row.fingerprint)
    return true
  })

  return {
    replace,
    changeStatus,
    dismissedFingerprints: (projectId) =>
      new Set(
        (dismissalsOf.all(projectId) as Array<{ fingerprint: string }>).map(
          (row) => row.fingerprint
        )
      )
  }
}
