import { nowIso } from '@domain/shared/id'
import type { Db } from './database'
import * as SQL from './finding-sql'

type Located = { readonly project_id: string; readonly fingerprint: string } | undefined

export interface DismissalWrites {
  changeStatus(findingId: string, dismissed: boolean): boolean
  dismissedFingerprints(projectId: string): ReadonlySet<string>
}

/**
 * El DESCARTE: decision del operador sobre si un hallazgo le importa. Va aparte
 * del ciclo de vida del problema, que decide la evidencia y no la persona.
 */
export function createDismissalWrites(db: Db): DismissalWrites {
  const locate = db.prepare(SQL.SELECT_FINDING)
  const setStatus = db.prepare(SQL.SET_STATUS)
  const addDismissal = db.prepare(SQL.INSERT_DISMISSAL)
  const dropDismissal = db.prepare(SQL.DELETE_DISMISSAL)
  const dismissalsOf = db.prepare(SQL.SELECT_DISMISSALS)

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
    changeStatus,
    dismissedFingerprints: (projectId) =>
      new Set(
        (dismissalsOf.all(projectId) as Array<{ fingerprint: string }>).map(
          (row) => row.fingerprint
        )
      )
  }
}
