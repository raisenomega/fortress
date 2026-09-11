import { redactarObservacion } from '@domain/system/cerco-de-observacion'
import { newId, nowIso } from '@domain/shared/id'
import type { NewSelfObservation, SelfObservation } from '@domain/system/self-observation'
import type { Db } from './database'
import { toObs, type Row } from './self-observation-row'

type Consulta = ReturnType<Db['prepare']>

export interface Consultas {
  readonly insert: Consulta
  readonly mismaObs: Consulta
  readonly avistar: Consulta
  readonly byId: Consulta
}

/**
 * El asiento de una observacion, con su cerco y su deduplicacion (ADR-085).
 *
 * DOS cosas pasan aqui y en este orden. Primero el CERCO —Fase 1—: el area y la
 * nota se redactan antes de tocar la base, porque `add` es el unico sitio por el
 * que pasan TODAS las observaciones y ponerlo aqui es lo que hace que cualquier
 * agente futuro quede cercado sin acordarse.
 *
 * Despues la DEDUPLICACION —Fase 4—: si ya hay una observacion PENDIENTE del
 * mismo `kind` y `area`, no se abre otra fila. Se le anade un AVISTAMIENTO con
 * el proyecto y la nota de esta vez, y la senal —«cuantos proyectos distintos se
 * toparon con esto»— sube sola. Nada se pierde: la nota nueva vive en su
 * avistamiento aunque la fila conserve la primera.
 *
 * Todo en UNA transaccion: una observacion sin su avistamiento saldria con
 * `vistaEn: 0` y el orden la hundiria, que es peor que no haberla guardado.
 */
export function asentar(db: Db, q: Consultas): (o: NewSelfObservation) => SelfObservation {
  return db.transaction((o: NewSelfObservation): SelfObservation => {
    const area = redactarObservacion(o.area, o.projectPath)
    const note = redactarObservacion(o.note, o.projectPath)
    const at = nowIso()

    const existente = q.mismaObs.get({ kind: o.kind, area }) as Row | undefined
    const id = existente?.id ?? newId()
    if (existente === undefined) {
      q.insert.run({ id, sourceProject: o.sourceProject, kind: o.kind, area, note, at })
    }
    q.avistar.run({ id, sourceProject: o.sourceProject, note, at })

    return toObs(q.byId.get(id) as Row)
  })
}
