import { identidadFusionada, type Fusion } from '@domain/project/fusion-de-duplicados'
import { masUrgente, type Severity } from '@domain/shared/severity'
import type { Db } from './database'
import { createAliasWrites } from './finding-alias-writes'
import { MARCAR_FUSIONADA } from './finding-fusion-sql'
import { ELEVAR_SEVERIDAD } from './reparar-gravedad'

const SEVERIDAD = `SELECT severity, identity FROM findings WHERE id = ?`

/**
 * La fusion por JUICIO escrita (ADR-101 §3): cada absorbida se marca como en
 * ADR-071 —fusionada-con-<ganadora>, centinela en su clave, sin resolved_at— y
 * su clave pasa a ser alias de la ganadora, con lo que apuntaba a ella. La
 * ganadora toma la severidad maxima del grupo. Todo en UNA transaccion.
 */
export function createFusionPorJuicio(db: Db): {
  fundir(projectId: string, fusion: Fusion): number
} {
  // prettier-ignore
  const leer = db.prepare(SEVERIDAD),
    marcar = db.prepare(MARCAR_FUSIONADA),
    elevar = db.prepare(ELEVAR_SEVERIDAD)
  const aliases = createAliasWrites(db)
  const fundir = db.transaction((_projectId: string, fusion: Fusion): number => {
    const at = new Date().toISOString()
    const severidades: Severity[] = []
    for (const id of [fusion.ganadora, ...fusion.absorbidas]) {
      const f = leer.get(id) as { severity: Severity; identity: string } | undefined
      if (f !== undefined) severidades.push(f.severity)
    }
    for (const id of fusion.absorbidas) {
      const f = leer.get(id) as { identity: string } | undefined
      if (f === undefined) continue
      aliases.retirarClave(id, fusion.ganadora, 'juicio', at)
      marcar.run({ id, motivo: `fusionada-con-${fusion.ganadora}`, identity: identidadFusionada(fusion.ganadora, f.identity) }) // prettier-ignore
    }
    if (severidades.length > 0)
      elevar.run({ id: fusion.ganadora, severity: masUrgente(severidades) })
    return fusion.absorbidas.length
  })
  return { fundir: (projectId, fusion) => fundir(projectId, fusion) }
}
