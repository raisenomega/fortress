import { fingerprintOf } from '@domain/project/finding-fingerprint'
import type { FilaDeFamilia, Nota, Restauracion } from '@domain/project/restauracion-de-severidad'
import { DEFECTOS_DE_AUDITORIA } from '@domain/scan/defectos-de-auditoria'
import type { Db } from './database'

const FAMILIAS = Object.keys(DEFECTOS_DE_AUDITORIA)
  .map((t) => `'${t}'`)
  .join(', ')

/** Las vivas de familia de un proyecto (ADR-103 §3): por tipo y ciclo de vida. */
const FILAS = `SELECT id, file, line, tipo, severity, lifecycle, title FROM findings
  WHERE project_id = ? AND lifecycle != 'EXTINCT' AND tipo IN (${FAMILIAS}) ORDER BY file, line`

/** Las notas «Severidad por ejes» del proyecto, la mas reciente primero. */
const NOTAS = `SELECT at, COALESCE(evidence, '') AS evidence FROM omega_log
  WHERE project_id = ? AND summary LIKE 'Severidad por ejes%' ORDER BY at DESC`

/**
 * Escribe la banda y la huella (que lleva la severidad), y SOLO si la fila
 * sigue en la banda que el plan dice: el fail-closed vive tambien en la
 * escritura, no solo en el plan. Nada mas cambia: ni identidad, ni tipo, ni
 * first_seen, ni lifecycle, ni status.
 */
export const RESTAURAR_SEVERIDAD = `UPDATE findings SET severity = @a, fingerprint = @fingerprint
  WHERE id = @id AND severity = @de`

export function leerFilasDeFamilia(db: Db, projectId: string): readonly FilaDeFamilia[] {
  return db.prepare(FILAS).all(projectId) as FilaDeFamilia[]
}

export function leerNotasDeSeveridad(db: Db, projectId: string): readonly Nota[] {
  return db.prepare(NOTAS).all(projectId) as Nota[]
}

/**
 * Aplica el plan en UNA transaccion. Una fila que ya no este en su banda
 * deshace todo: mejor cero escrituras que un lote a medias sobre una base que
 * se movio entre el plan y la aplicacion.
 */
export function restaurarSeveridad(db: Db, plan: readonly Restauracion[]): number {
  const restaurar = db.prepare(RESTAURAR_SEVERIDAD)
  const aplicar = db.transaction((): number => {
    let n = 0
    for (const r of plan) {
      const fingerprint = fingerprintOf({
        severity: r.a,
        title: r.title,
        file: r.file,
        line: r.line
      })
      const res = restaurar.run({ id: r.id, a: r.a, de: r.de, fingerprint })
      if (res.changes !== 1) throw new Error(`fail-closed: ${r.id} ya no esta en ${r.de}; no se escribe nada`) // prettier-ignore
      n += 1
    }
    return n
  })
  return aplicar()
}
