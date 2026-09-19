import { beforeEach, describe, expect, it } from 'vitest'
import { hallazgoAprobado, olvidarAprobacion } from '../aprobacion-del-plan'
import { deps, DICE, LOTE } from './juicio-del-plan-del-turno-fixture'
import { juzgarElPlanDelLote } from './juicio-del-plan-del-turno'

beforeEach(() => olvidarAprobacion('p1'))

const aprobados = (): readonly boolean[] => LOTE.map((id) => hallazgoAprobado('p1', id))

/**
 * ADR-097 §3. La OTRA MITAD de la puerta del §4: aquella cierra el paso, esta
 * es el unico camino que lo abre. Sin esto, el §4 dejo el lote en autonomo sin
 * ninguna forma legitima de ejecutarse.
 */
describe('en autonomo, OMEGA aprueba el plan y el lote queda autorizado', () => {
  it('con ADELANTE: los hallazgos del lote quedan aprobados', async () => {
    const { d } = deps('autonomo', DICE.ADELANTE)

    expect(await juzgarElPlanDelLote(d)).toBe('ADELANTE')
    expect(aprobados()).toEqual([true, true])
  })

  it('la barra dice que OMEGA esta mirando el plan ANTES de tardar', async () => {
    const { d, fases } = deps('autonomo', DICE.ADELANTE)

    await juzgarElPlanDelLote(d)

    expect(fases()).toEqual(['plan'])
  })
})

describe('lo que NO aprueba, no pasa: fail closed', () => {
  it('con REPLANTEA: nadie queda aprobado', async () => {
    const { d } = deps('autonomo', DICE.REPLANTEA)

    expect(await juzgarElPlanDelLote(d)).toBe('REPLANTEA')
    expect(aprobados()).toEqual([false, false])
  })

  it('si OMEGA no se deja leer: null, y tampoco aprueba', async () => {
    // No poder juzgar NO es aprobar. Es la misma decision que `juezDelPlan`
    // toma arriba, y aqui se comprueba que llega hasta la aprobacion.
    const { d } = deps('autonomo', DICE.ILEGIBLE)

    expect(await juzgarElPlanDelLote(d)).toBeNull()
    expect(aprobados()).toEqual([false, false])
  })
})
