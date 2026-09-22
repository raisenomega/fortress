import { identidadFusionada, planDeFusion, type Fusion } from '@domain/project/fusion-de-duplicados' // prettier-ignore
import { severidadDeLaSuperviviente } from '@domain/project/severidad-al-fundir'
import { masUrgente, type Severity } from '@domain/shared/severity'
import type { Db } from './database'
import { MARCAR_FUSIONADA } from './finding-fusion-sql'
import { ELEVAR_SEVERIDAD } from './reparar-gravedad'

const VIVAS = `SELECT id, identity AS identidad, first_seen AS firstSeen, severity
  FROM findings WHERE project_id = ? AND lifecycle != 'EXTINCT'`

interface Viva {
  readonly id: string
  readonly identidad: string
  readonly firstSeen: string
  readonly severity: Severity
}

/** Una fusion como texto comparable: misma clave, misma ganadora, mismas absorbidas. */
const firma = (f: Fusion): string =>
  `${f.identidad} => ${f.ganadora} < ${[...f.absorbidas].sort().join(',')}`

/**
 * Funde lo que empate entre las vivas del proyecto, tal y como lo hizo el paso
 * A: la mas antigua sobrevive, la absorbida se marca `fusionada-con-<ganadora>`
 * con el centinela en la identidad —no se borra, no se resuelve— y la
 * superviviente toma la severidad maxima del grupo (ADR-071).
 *
 * Fail-closed: el plan que sale de la BASE tiene que ser el APROBADO —el que
 * Jojo leyo en el plan impreso—; si difiere, lanza antes de escribir nada. Se
 * llama dentro de la transaccion de quien aplica, para que un lanzamiento
 * deshaga tambien lo reclasificado.
 */
export function fundirEnCaliente(
  db: Db,
  proyecto: string,
  aprobadas: readonly Fusion[]
): readonly Fusion[] {
  const vivas = db.prepare(VIVAS).all(proyecto) as Viva[]
  const plan = planDeFusion(vivas)
  const pide = plan.map(firma).sort(),
    trae = aprobadas.map(firma).sort()
  if (pide.join('\n') !== trae.join('\n'))
    throw new Error(`fail-closed: la base pide estas fusiones:\n${pide.join('\n')}\ny el plan aprobado trae:\n${trae.join('\n')}\nno se escribe nada`) // prettier-ignore
  const marcar = db.prepare(MARCAR_FUSIONADA),
    elevar = db.prepare(ELEVAR_SEVERIDAD)
  const porId = new Map(vivas.map((v) => [v.id, v.severity]))
  for (const f of plan) {
    for (const id of f.absorbidas) marcar.run({ id, motivo: `fusionada-con-${f.ganadora}`, identity: identidadFusionada(f.ganadora, f.identidad) }) // prettier-ignore
    const maxima = severidadDeLaSuperviviente(f, porId, masUrgente)
    if (maxima !== porId.get(f.ganadora)) elevar.run({ id: f.ganadora, severity: maxima })
  }
  return plan
}
