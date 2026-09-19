import { describe, expect, it } from 'vitest'
import { PLAN, META } from '../repair/juicio-de-omega-fixture'
import type { AppContext } from '../context'
import { juezDelPlan } from './juez-del-plan'
import type { CorridaDelCritico } from './tribunal-con-critico'

/** Contexto que apunta lo facturado: juzgar un plan cuesta y debe constar. */
function contextoQueApunta(): { context: AppContext; filas: () => readonly boolean[] } {
  const filas: boolean[] = []
  const context = {
    runs: { record: (r: { failed: boolean }) => filas.push(r.failed) }
  } as unknown as AppContext
  return { context, filas: () => filas }
}

const juezQueRecibe = (corrida: CorridaDelCritico, context: AppContext): ReturnType<typeof juezDelPlan> =>
  juezDelPlan({ context, projectId: 'p1', cwd: '/p', omega: { run: () => Promise.resolve(corrida) } }) // prettier-ignore

/**
 * ADR-097 §2. Lo que pasa cuando OMEGA no llega a juzgar el plan. Aparte del
 * fichero del juicio porque son dos preguntas —que dice y que NO dice— y
 * juntas pasaban de 75 lineas.
 */
describe('cuando OMEGA no juzga', () => {
  it('si no arranca: null, y NO una aprobacion inventada', async () => {
    const { context } = contextoQueApunta()
    const fallo = { ok: false as const, error: 'sin revisor', timedOut: false, runMeta: META }

    expect(await juezQueRecibe(fallo, context)(PLAN, 'un plan')).toBeNull()
  })

  it('si contesta algo ilegible: tambien null', async () => {
    const { context } = contextoQueApunta()
    const juez = juezQueRecibe({ ok: true, texto: 'me parece bien', runMeta: META }, context)

    expect(await juez(PLAN, 'un plan')).toBeNull()
  })

  it('y la corrida CONSTA igual, marcada como fallida: hubo gasto', async () => {
    const { context, filas } = contextoQueApunta()
    await juezQueRecibe({ ok: true, texto: 'ilegible', runMeta: META }, context)(PLAN, 'x')

    expect(filas()).toEqual([true])
  })
})
