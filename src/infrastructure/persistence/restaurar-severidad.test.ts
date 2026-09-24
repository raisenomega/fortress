import { describe, expect, it } from 'vitest'
import { planDeRestauracion } from '@domain/project/restauracion-de-severidad'
import type { Db } from './database'
import { AT1, banco, enLinea, fila, P } from './sync-con-alias-fixture'
import { leerFilasDeFamilia, leerNotasDeSeveridad, restaurarSeveridad } from './restaurar-severidad'

const NOTA = `INSERT INTO omega_log (id, at, project_id, agent_id, kind, verdict, summary, evidence)
  VALUES (?, ?, ?, 'security-reviewer', 'nota', 'info', 'Severidad por ejes: 2 de 2 con ejes difieren de lo que dijo el modelo; 0 sin ejes.', ?)`
const nota = (db: Db, evidence: string, at = AT1): void =>
  void db.prepare(NOTA).run(`n-${at}`, at, P, evidence)

function preparado(): { db: Db } {
  const { db, repo } = banco()
  const contraste = enLinea(23, { file: 'src/theme.css', tipo: 'accesibilidad', severity: 'HIGH', title: 'Contraste 4.08:1' }) // prettier-ignore
  const cors = enLinea(9, { tipo: 'cors-permisivo', severity: 'HIGH' })
  repo.syncFromScan(P, 'scan-1', [contraste, cors], AT1)
  nota(db, 'src/theme.css:23 LOW→HIGH (anonimo·disponibilidad·explotable-hoy); src/a.ts:9 LOW→HIGH (anonimo·ejecucion·explotable-hoy)') // prettier-ignore
  return { db }
}

describe('restaurarSeveridad: la palabra del modelo vuelve a la fila, y nada mas (ADR-103 §3)', () => {
  it('lee solo las vivas de familia, restaura banda y huella, y deja seguridad como estaba', () => {
    const { db } = preparado()
    const filas = leerFilasDeFamilia(db, P)
    expect(filas.map((f) => f.tipo)).toEqual(['accesibilidad'])
    const { plan } = planDeRestauracion(filas, leerNotasDeSeveridad(db, P))
    expect(plan).toHaveLength(1)
    const antes = fila(db, plan[0].id)

    expect(restaurarSeveridad(db, plan)).toBe(1)

    const despues = fila(db, plan[0].id)
    expect(despues.severity).toBe('LOW')
    expect(despues.fingerprint).toBe('LOW|src/theme.css|23|contraste 4.08:1')
    for (const c of ['identity', 'tipo', 'first_seen', 'lifecycle', 'status', 'title']) expect(despues[c]).toBe(antes[c]) // prettier-ignore
    const cors = db.prepare("SELECT severity FROM findings WHERE tipo = 'cors-permisivo'").get() as { severity: string } // prettier-ignore
    expect(cors.severity).toBe('HIGH')
  })

  it('es idempotente: la segunda pasada no tiene plan', () => {
    const { db } = preparado()
    restaurarSeveridad(db, planDeRestauracion(leerFilasDeFamilia(db, P), leerNotasDeSeveridad(db, P)).plan) // prettier-ignore
    expect(planDeRestauracion(leerFilasDeFamilia(db, P), leerNotasDeSeveridad(db, P)).plan).toEqual([]) // prettier-ignore
  })

  it('fail-closed en la escritura: una fila que ya no esta en su banda deshace el lote entero', () => {
    const { db } = preparado()
    const { plan } = planDeRestauracion(leerFilasDeFamilia(db, P), leerNotasDeSeveridad(db, P))
    expect(() => restaurarSeveridad(db, [{ ...plan[0], de: 'MEDIUM' }])).toThrow(/fail-closed/)
    expect(fila(db, plan[0].id).severity).toBe('HIGH')
  })
})
