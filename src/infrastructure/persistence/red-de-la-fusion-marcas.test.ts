import { describe, expect, it } from 'vitest'
import { absorbidasMalMarcadas, redDeLaFusion } from './red-de-la-fusion'
import { baseCon, NUEVA, PROYECTO, VIEJA, type Fila } from './red-de-la-fusion-fixture'

/** Una absorbida: identidad retirada por el centinela y el motivo que la nombra.
 *  Lo que cambia entre casos es solo como quedo marcada. */
const absorbida = (id: string, extra: Partial<Fila>): Fila => ({
  id,
  identity: `fusionada:ganadora|${NUEVA}`,
  extinctReason: 'fusionada-con-ganadora',
  ...extra
})

describe('criterio 5: toda absorbida esta EXTINCT y sin fecha de resolucion', () => {
  it('delata a la absorbida que se quedo viva', () => {
    const db = baseCon([absorbida('a', { lifecycle: 'ACTIVE' })])

    const [v] = absorbidasMalMarcadas(db)

    expect(v.criterio).toBe(5)
    expect(v.quien).toBe('a')
  })

  it('delata a la que dice haberse RESUELTO: no se resolvio, se fusiono', () => {
    // EXTINCT, que es lo correcto, y aun asi con fecha de resolucion: aisla la
    // segunda mitad del criterio, la que no se ve mirando solo el ciclo de vida.
    const marcada = { lifecycle: 'EXTINCT', resolvedAt: '2026-08-24T00:00:00Z' }
    const db = baseCon([absorbida('a', marcada)])

    expect(absorbidasMalMarcadas(db)).toHaveLength(1)
  })

  it('calla con la absorbida bien marcada', () => {
    const db = baseCon([absorbida('a', { lifecycle: 'EXTINCT' })])

    expect(absorbidasMalMarcadas(db)).toEqual([])
  })
})

describe('la red entera', () => {
  it('junta los cuatro criterios en una sola lista, en orden', () => {
    const db = baseCon([
      { id: 'vieja', identity: VIEJA },
      { id: 'sin-tipo', identity: NUEVA, tipo: 'otro' },
      { id: 'gemela', identity: NUEVA, tipo: 'otro' },
      absorbida('viva', { lifecycle: 'ACTIVE' })
    ])

    expect(redDeLaFusion(db, PROYECTO, []).map((v) => v.criterio)).toEqual([1, 2, 2, 3, 5])
  })

  it('calla entera cuando la migracion cuadra', () => {
    const db = baseCon([{ id: 'a', identity: NUEVA }, absorbida('b', { lifecycle: 'EXTINCT' })])

    expect(redDeLaFusion(db, PROYECTO, [])).toEqual([])
  })
})
