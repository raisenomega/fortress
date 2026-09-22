import { describe, expect, it } from 'vitest'
import type { Db } from './database'
import { fundirEnCaliente } from './fundir-en-caliente'
import { baseCon, NUEVA, PROYECTO } from './red-de-la-fusion-fixture'

const fila = (db: Db, id: string): Record<string, unknown> =>
  db.prepare('SELECT lifecycle, extinct_reason, resolved_at, identity, severity FROM findings WHERE id = ?').get(id) as Record<string, unknown> // prettier-ignore
const VIEJA_ANTES = { id: 'vieja', identity: NUEVA, firstSeen: '2026-08-01T00:00:00Z' }
const NUEVA_DESPUES = { id: 'nueva', identity: NUEVA, firstSeen: '2026-08-05T00:00:00Z' }
const APROBADA = [{ ganadora: 'vieja', absorbidas: ['nueva'], identidad: NUEVA }]

describe('fundirEnCaliente: los empates que deja el paso B', () => {
  it('la mas antigua sobrevive; la otra queda fusionada-con-ganadora, con centinela y sin resolved_at', () => {
    const db = baseCon([VIEJA_ANTES, NUEVA_DESPUES])
    expect(fundirEnCaliente(db, PROYECTO, APROBADA)).toEqual(APROBADA)
    expect(fila(db, 'nueva')).toMatchObject({ lifecycle: 'EXTINCT', extinct_reason: 'fusionada-con-vieja', resolved_at: null, identity: `fusionada:vieja|${NUEVA}` }) // prettier-ignore
    expect(fila(db, 'vieja')).toMatchObject({ lifecycle: 'ACTIVE', identity: NUEVA })
  })

  it('la superviviente toma la severidad maxima del grupo: fundir no baja la gravedad', () => {
    const db = baseCon([VIEJA_ANTES, { ...NUEVA_DESPUES, severity: 'HIGH' }])
    fundirEnCaliente(db, PROYECTO, APROBADA)
    expect(fila(db, 'vieja').severity).toBe('HIGH')
  })

  it('si la base pide fusiones que el plan aprobado no trae: lanza y no escribe nada', () => {
    const db = baseCon([VIEJA_ANTES, NUEVA_DESPUES])
    expect(() => fundirEnCaliente(db, PROYECTO, [])).toThrow('fail-closed')
    expect(fila(db, 'nueva')).toMatchObject({ lifecycle: 'ACTIVE', identity: NUEVA })
  })

  it('sin empates no escribe y devuelve vacio', () => {
    const db = baseCon([
      { id: 'a', identity: NUEVA },
      { id: 'b', identity: `${NUEVA}-otra` }
    ])
    expect(fundirEnCaliente(db, PROYECTO, [])).toEqual([])
    expect(fila(db, 'a')).toMatchObject({ lifecycle: 'ACTIVE', identity: NUEVA })
  })
})
