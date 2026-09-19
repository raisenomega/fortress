import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { aprobarLote, hallazgoAprobado, olvidarAprobacion } from '../aprobacion-del-plan'
import { banco, DICE, LOTE } from './juicio-del-plan-del-turno-fixture'
import { juzgarElPlanDelLote } from './juicio-del-plan-del-turno'

const fuente = (ruta: string): string => readFileSync(ruta, 'utf8')
/** El fuente SIN comentarios: un docblock que NOMBRA la funcion no es un llamador. */
// prettier-ignore
const codigo = (ruta: string): string =>
  fuente(ruta).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
const VIEJOS = ['viejo-1', 'viejo-2']

beforeEach(() => olvidarAprobacion('p1'))

/**
 * BUG 1, caducidad (a), CABLEADA. El test de `caducidad-de-la-aprobacion`
 * prueba que la funcion borra; este prueba que ALGUIEN la llama — que es
 * exactamente lo que faltaba: `olvidarAprobacion` existia y nadie la invocaba.
 */
describe('juzgar un plan nuevo caduca lo aprobado antes', () => {
  it('con REPLANTEA: los hallazgos de la vuelta anterior dejan de estar aprobados', async () => {
    aprobarLote('p1', VIEJOS)
    const { d } = banco('autonomo', [DICE.REPLANTEA, DICE.REPLANTEA, DICE.REPLANTEA, DICE.REPLANTEA]) // prettier-ignore

    await juzgarElPlanDelLote(d)

    expect(VIEJOS.map((id) => hallazgoAprobado('p1', id))).toEqual([false, false])
  })

  it('con ADELANTE: caduca lo viejo Y aprueba lo nuevo, sin mezclarlos', async () => {
    aprobarLote('p1', VIEJOS)
    const { d } = banco('autonomo', [DICE.ADELANTE])

    await juzgarElPlanDelLote(d)

    expect(VIEJOS.map((id) => hallazgoAprobado('p1', id))).toEqual([false, false])
    expect(LOTE.map((id) => hallazgoAprobado('p1', id))).toEqual([true, true])
  })

  it('en SUPERVISADO no toca nada: alli no hay aprobacion que caducar', async () => {
    // El turno de plan ni se juzga en supervisado. Caducar ahi seria borrarle al
    // operador un permiso que este flujo no le dio.
    aprobarLote('p1', VIEJOS)
    const { d } = banco('supervisado', [DICE.ADELANTE])

    await juzgarElPlanDelLote(d)

    expect(VIEJOS.map((id) => hallazgoAprobado('p1', id))).toEqual([true, true])
  })
})

/**
 * BUG 1, caducidad (b), CABLEADA, y el angulo del ATACANTE. Se lee del FUENTE
 * porque el sitio importa: gastar el permiso ANTES de `guardRun` lo quemaria en
 * un turno que el carril deniega y que nunca llego a existir.
 */
describe('el permiso se gasta en el main, y solo en el main', () => {
  it('se gasta DESPUES de las dos puertas, no antes', () => {
    const handler = fuente('src/infrastructure/ipc/chat-send-handler.ts')
    const puerta = handler.indexOf('guardRun(context')
    const gasto = handler.indexOf('gastarAprobacion(input.projectId')

    expect(puerta).toBeGreaterThan(-1)
    expect(gasto).toBeGreaterThan(puerta)
  })

  it('EL ATACANTE: el renderer no escribe NI borra la aprobacion', () => {
    // Si el renderer pudiera tocarla, quien pide pasar firmaria su permiso.
    for (const fn of ['aprobarLote', 'gastarAprobacion', 'olvidarAprobacion']) {
      expect(codigo('src/presentation/services/resolver-lote-en-terminal.ts')).not.toContain(fn)
      expect(codigo('src/presentation/services/lote-por-enter.ts')).not.toContain(fn)
    }
  })
})
