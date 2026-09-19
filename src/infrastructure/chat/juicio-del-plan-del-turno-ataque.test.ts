import { beforeEach, describe, expect, it } from 'vitest'
import { hallazgoAprobado, olvidarAprobacion } from '../aprobacion-del-plan'
import { banco, DICE, LOTE, TURNO_DE_PLAN } from './juicio-del-plan-del-turno-fixture'
import { juzgarElPlanDelLote } from './juicio-del-plan-del-turno'

beforeEach(() => olvidarAprobacion('p1'))

const aprobados = (): readonly boolean[] => LOTE.map((id) => hallazgoAprobado('p1', id))

/** El juicio con las corridas contadas: aprobar cuesta, y no aprobar no debe. */
function conCorridasContadas(modo: string): ReturnType<typeof banco> & { corridas: () => number } {
  let corridas = 0
  const base = banco(modo, [DICE.ADELANTE])
  const d = {
    ...base.d,
    omega: {
      run: () => (corridas += 1, Promise.resolve({ ok: true as const, texto: DICE.ADELANTE, runMeta: { durationMs: 1, startedAt: 0, endedAt: 1 } })) // prettier-ignore
    }
  }
  return { ...base, d, corridas: () => corridas }
}

/**
 * ADR-097 §3, desde el angulo del ATACANTE: no se comprueba que la funcion
 * exista, sino que los caminos para torcerla NO funcionan.
 */
describe('el modo sale de la BASE, nunca del mensaje', () => {
  it('EL CAMINO REAL: el mensaje dice «supervisado» y aun asi se juzga', async () => {
    // `planDelLote` manda SIEMPRE `mode: 'supervisado'` —el turno de plan no
    // edita—, incluso con el proyecto en autonomo. Si esto leyera `input.mode`,
    // el lote en autonomo no se juzgaria NUNCA y quedaria muerto tras la puerta.
    const { d } = banco('autonomo', [DICE.ADELANTE])

    expect(d.input.mode).toBe('supervisado')
    expect(await juzgarElPlanDelLote(d)).toBe('ADELANTE')
  })

  it('y con la base en supervisado NO juzga, ni gasta una corrida', async () => {
    // Supervisado INTACTO: alli aprueba el operador con su Enter (ADR-088). Y
    // no se le cobra un juicio que nadie pidio.
    const { d, corridas } = conCorridasContadas('supervisado')

    expect(await juzgarElPlanDelLote(d)).toBeNull()
    expect(corridas()).toBe(0)
    expect(aprobados()).toEqual([false, false])
  })
})

describe('solo el turno de PLAN se juzga como plan', () => {
  it('un turno con FOCO no pasa por aqui: a ese lo juzga el fix, con el diff', async () => {
    const { d, corridas } = conCorridasContadas('autonomo')
    const conFoco = { ...d, input: { ...TURNO_DE_PLAN, findingId: 'f1' } }

    expect(await juzgarElPlanDelLote(conFoco)).toBeNull()
    expect(corridas()).toBe(0)
  })

  it('un mensaje suelto tampoco: sin lote no hay direccion que juzgar', async () => {
    const { d, corridas } = conCorridasContadas('autonomo')
    const suelto = { ...d, input: { ...TURNO_DE_PLAN, lote: undefined } }

    expect(await juzgarElPlanDelLote(suelto)).toBeNull()
    expect(corridas()).toBe(0)
  })
})
