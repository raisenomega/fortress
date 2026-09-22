import { describe, expect, it } from 'vitest'
import { conIdentidadVieja } from './red-de-la-fusion'
import { baseCon, PROYECTO, VIEJA } from './red-de-la-fusion-fixture'

/**
 * El paso A del backfill de mailbd re-identifica las 62 zombis con gemela y deja
 * las 36 sin gemela para el paso B (juicio). El criterio 1 tiene que poder
 * mirar hacia otro lado SOLO con esas, y por su id: lo demas sigue delatandose.
 */
describe('criterio 1 con filas fuera de alcance', () => {
  it('calla con una vieja declarada FUERA DE ALCANCE: el paso A no toca a las 36 sin gemela', () => {
    const db = baseCon([{ id: 'sin-gemela', identity: VIEJA }])
    expect(conIdentidadVieja(db, PROYECTO, ['sin-gemela'])).toEqual([])
    expect(conIdentidadVieja(db, PROYECTO, ['otra'])).toHaveLength(1)
  })
})
