import { beforeEach, describe, expect, it } from 'vitest'
import { findingIdentity } from '@domain/project/finding-identity'
import { createBench, PROJECT, type Bench } from './finding-fixture'
import { CORREA, conLasTresFilas, memoria, reclasificarYFusionar } from './finding-fusion-fixture'
import * as SQL from './finding-sql'

let bench: Bench

beforeEach(() => {
  bench = createBench()
  conLasTresFilas(bench)
  reclasificarYFusionar(bench)
})

/**
 * La trampa que el inventario destapo: marcar la absorbida NO basta.
 *
 * `SELECT_BY_IDENTITY` no filtra por ciclo de vida, asi que una absorbida que
 * conservara la clave del ganador podia salir elegida en el escaneo siguiente, y
 * `TOUCH_FINDING` —que pone lifecycle ACTIVE y resolved_at NULL— la devolveria a
 * la vida. Volverian a ser dos vivas: justo lo que la fusion viene a impedir.
 */
describe('una fila fusionada no vuelve', () => {
  it('el escaneo siguiente elige a la ganadora, no a la absorbida', () => {
    const elegida = bench.db.prepare(SQL.SELECT_BY_IDENTITY).get(PROJECT, findingIdentity(CORREA))

    expect(elegida).toEqual({ id: 'vieja' })
  })

  it('un escaneo entero del mismo defecto la deja donde estaba', () => {
    bench.repo.syncFromScan(PROJECT, 's2', [CORREA], '2026-08-24T00:00:00Z', new Set())

    expect(memoria(bench, 'media').lifecycle).toBe('EXTINCT')
    expect(memoria(bench, 'media').resolved_at).toBeNull()
    expect(bench.rows()).toBe(3)
  })

  it('el centinela no queda vacio: vaciarlo la devolveria al PENDING', () => {
    // La migracion de memoria rellena las filas con `identity = ''`. Una
    // absorbida con la clave vacia se recalcularia sola en el arranque siguiente.
    expect(memoria(bench, 'media').identity).not.toBe('')
    expect(memoria(bench, 'media').identity).toContain('fusionada:vieja')
  })
})
