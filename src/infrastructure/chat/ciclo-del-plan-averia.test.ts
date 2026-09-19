import { beforeEach, describe, expect, it } from 'vitest'
import { hallazgoAprobado, olvidarAprobacion } from '../aprobacion-del-plan'
import { banco, DICE, LOTE } from './juicio-del-plan-del-turno-fixture'
import { juzgarElPlanDelLote } from './juicio-del-plan-del-turno'

beforeEach(() => olvidarAprobacion('p1'))

const aprobados = (): readonly boolean[] => LOTE.map((id) => hallazgoAprobado('p1', id))

/**
 * ADR-097 §3. Una AVERIA no es un LIMITE ALCANZADO, y el autonomo no las cuenta
 * igual. Aparte del fichero del bucle porque son dos preguntas —cuando para de
 * intentarlo y que dice cuando algo se rompe— y juntas pasaban de 75 lineas.
 */
describe('una repropuesta que fallo NO se juzga', () => {
  it('turno caido: NO aprueba, aunque OMEGA fuera a decir ADELANTE', async () => {
    // LA TRAMPA: un plan vacio no se puede evaluar, y `NO_SE_PUEDE_SABER` NO
    // deniega (§2.3). Sin esta guarda, un turno que revienta acabaria
    // APROBANDO el lote — el peor final posible para un fallo tecnico.
    const { d } = banco('autonomo', [DICE.REPLANTEA, DICE.ADELANTE], {
      reproponer: () => Promise.resolve('')
    })

    expect(await juzgarElPlanDelLote(d)).toBeNull()
    expect(aprobados()).toEqual([false, false])
  })

  it('y tampoco se anota «decision abierta»: no agoto nada, se rompio', async () => {
    // Decirle al operador «decide tu» cuando lo que pasa es que el turno no
    // arranco le manda a pensar sobre un plan en vez de a mirar la averia.
    const { d, hilo } = banco('autonomo', [DICE.REPLANTEA], {
      reproponer: () => Promise.resolve('')
    })

    await juzgarElPlanDelLote(d)

    expect(hilo()).toHaveLength(0)
  })

  it('si OMEGA no se deja leer en la primera vuelta: null y hilo limpio', async () => {
    const { d, hilo } = banco('autonomo', [DICE.ILEGIBLE])

    expect(await juzgarElPlanDelLote(d)).toBeNull()
    expect(hilo()).toHaveLength(0)
    expect(aprobados()).toEqual([false, false])
  })
})
