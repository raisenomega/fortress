import { describe, expect, it } from 'vitest'
import { aliasDe, AT1, AT2, banco, clave, enLinea, fila, idDe, P, registrar } from './sync-con-alias-fixture' // prettier-ignore

describe('fundirPorJuicio: la fusion que decide un agente, con alias (ADR-101 §3)', () => {
  it('marca a la absorbida, registra su clave como alias de la ganadora y sube la severidad', () => {
    const { db, repo } = banco()
    repo.syncFromScan(P, 's1', [enLinea(10)], AT1)
    repo.syncFromScan(P, 's2', [enLinea(20, { severity: 'HIGH' })], AT2)
    const a = idDe(db, clave(10)),
      b = idDe(db, clave(20))
    repo.fundirPorJuicio(P, { ganadora: a, absorbidas: [b], identidad: clave(10) })
    expect(fila(db, b)).toMatchObject({ lifecycle: 'EXTINCT', extinct_reason: `fusionada-con-${a}`, identity: `fusionada:${a}|${clave(20)}`, resolved_at: null }) // prettier-ignore
    expect(aliasDe(db, clave(20))).toBe(a)
    expect(fila(db, a)).toMatchObject({
      lifecycle: 'ACTIVE',
      severity: 'HIGH',
      identity: clave(10)
    })
  })

  it('los alias que apuntaban a la absorbida pasan a la ganadora: ninguno queda colgando', () => {
    const { db, repo } = banco()
    repo.syncFromScan(P, 's1', [enLinea(10), enLinea(20)], AT1)
    const a = idDe(db, clave(10)),
      b = idDe(db, clave(20))
    registrar(db, clave(99), b)
    repo.fundirPorJuicio(P, { ganadora: a, absorbidas: [b], identidad: clave(10) })
    expect(aliasDe(db, clave(99))).toBe(a)
  })
})
