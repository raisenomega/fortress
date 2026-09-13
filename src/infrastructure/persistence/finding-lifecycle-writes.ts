import type { Db } from './database'
import * as SQL from './finding-sql'

/**
 * Las escrituras del CICLO DE VIDA, aparte de las del escaneo.
 *
 * Salen de `finding-writes` por la misma linea por la que el SQL ya estaba
 * partido en `finding-lifecycle-sql`: nacer y volver a verse es una cosa, y
 * cerrar —o avisar de que no se puede cerrar— es otra. La cuarta las paso del
 * limite, y juntar por tamano lo que se lee junto habria sido el criterio
 * equivocado; esta division ya existia un piso mas abajo.
 */
export interface LifecycleWrites {
  markExtinct(ids: readonly string[], at: string, motivo: string, extinguidoPor: string | null): void // prettier-ignore
  markMitigated(findingId: string, note: string, at: string): boolean
  markActive(findingId: string): boolean
  anotarVerificacion(findingId: string, note: string): boolean
  devolverALaCola(findingId: string, note: string): boolean
}

export function createLifecycleWrites(db: Db): LifecycleWrites {
  const extinguish = db.prepare(SQL.MARK_EXTINCT)
  const mitigate = db.prepare(SQL.MARK_MITIGATED)
  const activate = db.prepare(SQL.MARK_ACTIVE)
  const anotar = db.prepare(SQL.ANOTAR_VERIFICACION)
  const devolver = db.prepare(SQL.DEVOLVER_A_LA_COLA)

  // Indivisible: media tanda dejaria el registro diciendo que unos problemas se
  // cerraron y otros no. El motivo y el quien van con cada fila, no en un log.
  const markExtinct = db.transaction(
    (ids: readonly string[], at: string, motivo: string, extinguidoPor: string | null) => {
      for (const id of ids) extinguish.run({ id, at, motivo, extinguidoPor })
    }
  )

  return {
    markExtinct,
    // Devuelve si marco algo: el WHERE exige ACTIVE, asi que un hallazgo ya
    // extinto o ya mitigado no se toca y el operador se entera en vez de creer
    // que lo hizo.
    markMitigated: (findingId, note, at) => mitigate.run({ id: findingId, note, at }).changes > 0,
    markActive: (findingId) => activate.run({ id: findingId }).changes > 0,
    // Las dos devuelven si escribieron: el WHERE exige MITIGATED, asi que quien
    // las llame sobre una fila ya extinta se entera en vez de creer que aviso.
    anotarVerificacion: (findingId, note) => anotar.run({ id: findingId, note }).changes > 0,
    devolverALaCola: (findingId, note) => devolver.run({ id: findingId, note }).changes > 0
  }
}
