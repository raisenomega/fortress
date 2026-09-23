import { describe, expect, it } from 'vitest'
import { aliasDe, AT1, AT2, banco, clave, enLinea, fila, filas, idDe, P, registrar } from './sync-con-alias-fixture' // prettier-ignore

describe('el sync consulta el alias SOLO al fallar la clave exacta (ADR-101, palanca 2)', () => {
  it('con alias, toca a la superviviente y no inserta; la clave anterior queda como alias', () => {
    const { db, repo } = banco()
    repo.syncFromScan(P, 's1', [enLinea(10)], AT1)
    const r1 = idDe(db, clave(10))
    registrar(db, clave(20), r1)
    repo.syncFromScan(P, 's2', [enLinea(20)], AT2)
    expect(filas(db)).toBe(1)
    expect(fila(db, r1)).toMatchObject({
      line: 20,
      last_seen: AT2,
      lifecycle: 'ACTIVE',
      identity: clave(10)
    })
    expect(aliasDe(db, clave(10))).toBe(r1)
  })

  it('sin alias, inserta como hoy', () => {
    const { db, repo } = banco()
    repo.syncFromScan(P, 's1', [enLinea(10)], AT1)
    repo.syncFromScan(P, 's2', [enLinea(20)], AT2)
    expect(filas(db)).toBe(2)
  })

  it('el alias no caduca: una superviviente extinguida por juicio resucita si su defecto vuelve', () => {
    const { db, repo } = banco()
    repo.syncFromScan(P, 's1', [enLinea(10)], AT1)
    const r1 = idDe(db, clave(10))
    repo.markExtinct([r1], AT1, 'juicio_obsoleto', 'agente')
    registrar(db, clave(20), r1)
    repo.syncFromScan(P, 's2', [enLinea(20)], AT2)
    expect(filas(db)).toBe(1)
    expect(fila(db, r1)).toMatchObject({ lifecycle: 'ACTIVE', resolved_at: null })
  })
})

describe('un alias que no lleva a una superviviente no manda', () => {
  it('hacia una absorbida: NUNCA la toca, inserta, y el alias se retira', () => {
    const { db, repo } = banco()
    repo.syncFromScan(P, 's1', [enLinea(10), enLinea(30)], AT1)
    const r1 = idDe(db, clave(10)),
      r2 = idDe(db, clave(30))
    db.prepare(`UPDATE findings SET lifecycle = 'EXTINCT', extinct_reason = ?, identity = ? WHERE id = ?`).run(`fusionada-con-${r1}`, `fusionada:${r1}|${clave(30)}`, r2) // prettier-ignore
    registrar(db, clave(40), r2)
    repo.syncFromScan(P, 's2', [enLinea(40)], AT2)
    expect(fila(db, r2)).toMatchObject({ lifecycle: 'EXTINCT', extinct_reason: `fusionada-con-${r1}`, last_seen: AT1 }) // prettier-ignore
    expect(filas(db)).toBe(3)
    expect(aliasDe(db, clave(40))).toBeNull()
  })

  it('hacia una fila que no existe: se ignora, inserta, y el alias se retira', () => {
    const { db, repo } = banco()
    registrar(db, clave(50), 'nadie')
    repo.syncFromScan(P, 's1', [enLinea(50)], AT1)
    expect(filas(db)).toBe(1)
    expect(aliasDe(db, clave(50))).toBeNull()
  })
})
