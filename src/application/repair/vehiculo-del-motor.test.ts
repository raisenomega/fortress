import { describe, expect, it } from 'vitest'
import { NO_ES_SU_VEHICULO, esVehiculoDelMotor } from '@domain/repair/vehiculo-del-motor'
import { bench, hallazgo } from './plan-repair-fixture'
import { retryBench, vieja } from './retry-repair-fixture'
import { planRepair } from './plan-repair'
import { retryRepair } from './retry-repair'

const banco = (esRepoPropio: boolean): ReturnType<typeof bench> =>
  bench({ findings: [hallazgo('f1', 'src/a.ts')], esRepoPropio })

describe('el Motor solo trabaja FORTRESS (ADR-107)', () => {
  it('la politica es del dominio: solo el repo propio', () => {
    expect(esVehiculoDelMotor(true)).toBe(true)
    expect(esVehiculoDelMotor(false)).toBe(false)
  })

  it('un proyecto de CLIENTE no engendra propuesta', async () => {
    const b = banco(false)

    expect(await planRepair(b.context, 'p1')).toBeNull()
    expect(b.inserted).toHaveLength(0)
  })

  it('FORTRESS si: la cura no rompe su propio drenaje', async () => {
    const b = banco(true)
    await planRepair(b.context, 'p1')

    expect(b.inserted.length).toBeGreaterThan(0)
  })

  /**
   * El OTRO nacimiento. Guardar solo `planRepair` dejaria el reintento como
   * puerta trasera: nace su propia propuesta, con su propio `insert`.
   */
  it('el REINTENTO de un cliente tampoco: es el otro nacimiento', async () => {
    const b = retryBench({ old: vieja({ state: 'RECHAZADO' }), esRepoPropio: false })
    const r = await retryRepair(b.context, vieja().id)

    expect(r).toMatchObject({ ok: false, reason: NO_ES_SU_VEHICULO })
    expect(b.inserted).toHaveLength(0)
  })
})
