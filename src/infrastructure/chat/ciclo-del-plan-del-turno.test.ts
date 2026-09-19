import { beforeEach, describe, expect, it } from 'vitest'
import { hallazgoAprobado, olvidarAprobacion } from '../aprobacion-del-plan'
import { banco, DICE, LOTE } from './juicio-del-plan-del-turno-fixture'
import { juzgarElPlanDelLote } from './juicio-del-plan-del-turno'

beforeEach(() => olvidarAprobacion('p1'))

const aprobados = (): readonly boolean[] => LOTE.map((id) => hallazgoAprobado('p1', id))
const SIEMPRE_REPLANTEA = [DICE.REPLANTEA, DICE.REPLANTEA, DICE.REPLANTEA, DICE.REPLANTEA]

/**
 * ADR-097 §3 y §5. El bucle del replanteo: productor ↔ OMEGA, sin tribunal —el
 * critico ataca un diff y aqui no hay— y sin contador: se sigue mientras la
 * propuesta AVANCE, igual que `hastaConverger`.
 */
describe('el productor repropone y puede converger', () => {
  it('REPLANTEA y luego ADELANTE: aprueba, tras UNA repropuesta', async () => {
    let n = 0
    const { d, vueltas } = banco('autonomo', [DICE.REPLANTEA, DICE.ADELANTE], {
      reproponer: () => ((n += 1), Promise.resolve(`otra direccion ${n}`))
    })

    expect(await juzgarElPlanDelLote(d)).toBe('ADELANTE')
    expect(aprobados()).toEqual([true, true])
    expect(vueltas()).toBe(0) // las cuenta el override, no el del banco
    expect(n).toBe(1)
  })

  it('cada replanteo es un TURNO: se ve en el hilo, no pasa por detras', async () => {
    // `reproponer` ES la llamada a `sendMessage`: una repropuesta invisible
    // seria gasto que el operador no puede auditar (ADR-091 §0, el recibo).
    const { d, vueltas } = banco('autonomo', SIEMPRE_REPLANTEA)

    await juzgarElPlanDelLote(d)

    expect(vueltas()).toBeGreaterThan(0)
  })
})

describe('dos oportunidades medidas por PROGRESO, no por cupo', () => {
  it('a la primera huella repetida NO corta: le deja una vuelta mas', async () => {
    // Vuelta 1 el plan del turno, 2 la primera repropuesta (texto nuevo), 3 la
    // MISMA — ahi repite, y en vez de cortar se le da la 4ª. La respuesta de un
    // modelo no es la misma dos veces (`retry-eligibility`).
    const { d, vueltas } = banco('autonomo', SIEMPRE_REPLANTEA)

    await juzgarElPlanDelLote(d)

    expect(vueltas()).toBe(3)
  })

  it('a la SEGUNDA repetida para, y no aprueba nada', async () => {
    const { d } = banco('autonomo', SIEMPRE_REPLANTEA)

    expect(await juzgarElPlanDelLote(d)).toBe('REPLANTEA')
    expect(aprobados()).toEqual([false, false])
  })

  it('y el lote aterriza en el hilo diciendo que necesita un humano', async () => {
    const { d, hilo } = banco('autonomo', SIEMPRE_REPLANTEA)

    await juzgarElPlanDelLote(d)

    expect(hilo()).toHaveLength(1)
    expect(hilo()[0]).toMatchObject({ role: 'system', projectId: 'p1' })
    expect(hilo()[0]?.content).toContain('necesita un humano')
  })
})
