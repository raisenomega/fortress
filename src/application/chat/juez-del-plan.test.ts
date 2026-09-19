import { describe, expect, it } from 'vitest'
import { PLAN, META } from '../repair/juicio-de-omega-fixture'
import type { AppContext } from '../context'
import { juezDelPlan } from './juez-del-plan'
import type { CorridaDelCritico } from './tribunal-con-critico'

const BLOQUE =
  'PLAN:{"ataca_la_causa":"SI","declara_tocar_lo_intocable":"NO","alcance":"AJUSTADO","razon":"va a la causa"}:END-PLAN' // prettier-ignore

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
 * ADR-097 §2. El juez del plan de punta a punta: prompt propio, bloque propio,
 * y factura. Reusa el fixture REAL del hallazgo (`PLAN`), no uno inventado.
 */
describe('el juez del plan', () => {
  it('lee el bloque PLAN y devuelve el juicio', async () => {
    const { context } = contextoQueApunta()
    const juez = juezQueRecibe({ ok: true, texto: BLOQUE, runMeta: META }, context)

    expect(await juez(PLAN, 'borro el sink')).toMatchObject({ veredicto: 'ADELANTE' })
  })

  it('el prompt lleva el PLAN del productor y el hallazgo', async () => {
    let visto = ''
    const juez = juezDelPlan({
      context: contextoQueApunta().context,
      projectId: 'p1',
      cwd: '/p',
      omega: { run: (_a, prompt) => ((visto = prompt), Promise.resolve({ ok: true, texto: BLOQUE, runMeta: META })) } // prettier-ignore
    })

    await juez(PLAN, 'borro el sink de report.html')

    expect(visto).toContain('borro el sink de report.html')
    expect(visto).toContain(PLAN.target.file)
  })

  it('le dice a OMEGA que juzga una PROMESA, no un hecho', async () => {
    // La honestidad del §2.3 va DENTRO del prompt: sin eso OMEGA juzgaria como
    // si tuviera un diff y devolveria una certeza que no tiene.
    let visto = ''
    const juez = juezDelPlan({
      context: contextoQueApunta().context,
      projectId: 'p1',
      cwd: '/p',
      omega: { run: (_a, p) => ((visto = p), Promise.resolve({ ok: true, texto: BLOQUE, runMeta: META })) } // prettier-ignore
    })

    await juez(PLAN, 'un plan')

    expect(visto).toContain('UNA PROMESA, NO UN HECHO')
    expect(visto).toContain('NO_SE_PUEDE_SABER')
  })
})
