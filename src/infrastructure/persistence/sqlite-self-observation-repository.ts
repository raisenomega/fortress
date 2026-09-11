import type { SelfObservationRepository } from '@domain/system/self-observation-repository'
import { toObs, type Row } from './self-observation-row'
import * as SQL from './self-observation-sql'
import { asentar } from './asentar-observacion'
import type { Db } from './database'

/**
 * Backlog de auto-mejora de FORTRESS. Parametrizado; sin cascada de proyectos.
 *
 * El CERCO de ADR-085 vive en `add` y no en el parser, a proposito: `add` es el
 * UNICO sitio por el que pasan TODAS las observaciones, vengan del JSON de un
 * analisis, de un bloque en prosa o de un agente que aun no existe. Ponerlo en
 * `toSelfNotes` dejaria fuera al primero que llegue por otra puerta — la misma
 * leccion que los seis agentes que gastaban sin constar porque cada llamante
 * tenia que acordarse.
 */
export function createSqliteSelfObservationRepository(db: Db): SelfObservationRepository {
  const insert = db.prepare(SQL.INSERT_OBS)
  const mismaObs = db.prepare(SQL.MISMA_OBS)
  const avistar = db.prepare(SQL.INSERT_SIGHTING)
  const vistaEn = db.prepare(SQL.VISTA_EN)
  const byId = db.prepare('SELECT * FROM self_observations WHERE id = ?')
  const open = db.prepare(
    "SELECT * FROM self_observations WHERE status = 'pendiente' ORDER BY created_at DESC"
  )
  // Por `attended_at` (cuando se CERRO, no cuando se observo) y desempatado: sin
  // eso una tanda empata en masa y el LIMIT corta a capricho. Ver `listClosed`.
  const closed = db.prepare(
    `SELECT * FROM self_observations WHERE status != 'pendiente'
     ORDER BY attended_at DESC, created_at DESC, id LIMIT ?`
  )
  const all = db.prepare('SELECT * FROM self_observations ORDER BY created_at DESC, id')
  const update = db.prepare(`UPDATE self_observations
    SET status = @status, reason = @reason, attended_by = @attendedBy, attended_at = @attendedAt
    WHERE id = @id`)

  const setStatus = (entrada: Parameters<SelfObservationRepository['setStatus']>[0]): boolean =>
    update.run(entrada).changes > 0

  return {
    add: asentar(db, { insert, mismaObs, avistar, byId }),
    vistaEn: (id) => (vistaEn.get(id) as { n: number }).n,
    listOpen: () => (open.all() as Row[]).map(toObs),
    listClosed: (limite) => (closed.all(limite) as Row[]).map(toObs),
    listAll: () => (all.all() as Row[]).map(toObs),
    findById: (id) => {
      const row = byId.get(id) as Row | undefined
      return row ? toObs(row) : null
    },
    setStatus
  }
}
