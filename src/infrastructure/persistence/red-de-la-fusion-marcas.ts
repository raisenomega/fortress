import type { Db } from './database'
import type { Violacion } from './violacion'

/** 5 — Toda absorbida esta EXTINCT y sin fecha de resolucion: no se resolvio,
 *  se fusiono, y un `resolved_at` afirmaria lo que no paso. */
export function absorbidasMalMarcadas(db: Db): readonly Violacion[] {
  const sql = `SELECT id, extinct_reason AS motivo FROM findings
    WHERE extinct_reason LIKE 'fusionada-con-%'
    AND (lifecycle != 'EXTINCT' OR resolved_at IS NOT NULL)`
  const filas = db.prepare(sql).all() as { id: string; motivo: string }[]
  return filas.map((f) => ({ criterio: 5, quien: f.id, detalle: `mal marcada: ${f.motivo}` }))
}
