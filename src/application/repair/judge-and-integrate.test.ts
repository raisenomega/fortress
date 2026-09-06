import { describe, expect, it } from 'vitest'
import type { OmegaVerdict } from '@domain/repair/omega-verdict'
import type { AutoMergeDeps } from './auto-merge-types'
import { judgeAndIntegrate } from './judge-and-integrate'
import { APROBADO, bench, type Bench } from './run-omega-fixture'

/** Vetado por el EJE, no por la etiqueta: el motor recomputa el global. */
const VETADO: OmegaVerdict = { ...APROBADO, resuelve_el_hallazgo: 'NO', veredicto_global: 'VETADO' }
const META = { tokensUsed: 1000, durationMs: 1, startedAt: 1, endedAt: 2 }

const NADA = {
  readConfig: () => ({ kind: 'not-present' }),
  mergeApplier: { apply: () => Promise.resolve({ ok: false, kind: 'unknown', gitOutput: '' }) },
  now: () => 1
} as unknown as AutoMergeDeps

/** `runOmega` no mira el proyecto NUNCA, asi que contar consultas distingue los
 *  caminos: 0 es "el veto corto antes", 1 es "la regla del repo propio miro", 2
 *  es "ademas se planteo integrar" —la segunda la hace `gatherCase`—. */
function conTestigo(b: Bench): { ctx: Bench['context']; consultas: () => number } {
  let n = 0
  const ctx = {
    ...b.context,
    projects: { findById: () => ((n += 1), { id: 'p1', path: '/repo', contaminated: false }) }
  } as unknown as Bench['context']
  return { ctx, consultas: () => n }
}

const conVerdicto = (verdict: OmegaVerdict): Bench =>
  bench({ result: { ok: true, verdict, runMeta: META } })

/** El proyecto NO es el repo de FORTRESS: el camino de cualquier otro. */
const AJENO = { esRepoPropio: (): boolean => false }

describe('judgeAndIntegrate: el veto corta antes de mirar la politica', () => {
  it('vetado: ni se plantea integrar', async () => {
    // Preguntarle a la politica por un fix que el revisor acaba de rechazar
    // ensuciaria el libro con una decision que nadie tenia que tomar.
    const b = conVerdicto(VETADO)
    const { ctx, consultas } = conTestigo(b)

    const r = await judgeAndIntegrate(ctx, 'prop-1', { omega: b.deps, autoMerge: NADA, ...AJENO })

    expect(r.omega).toMatchObject({ ok: false })
    expect(r.merge).toBeNull() // no se planteo: no hay nada que contar
    expect(consultas()).toBe(0)
  })

  it('aprobado: la integracion se plantea', async () => {
    const b = conVerdicto(APROBADO)
    const { ctx, consultas } = conTestigo(b)

    const r = await judgeAndIntegrate(ctx, 'prop-1', { omega: b.deps, autoMerge: NADA, ...AJENO })

    expect(r.omega).toMatchObject({ ok: true })
    expect(r.merge).not.toBeNull() // se planteo: el informe lo cuenta
    expect(consultas()).toBe(2)
  })

  it('si preguntar de quien es el codigo revienta, el veredicto sale igual', async () => {
    // OMEGA ya juzgo y ya lo asento. El operador tiene derecho a saber que su
    // propuesta paso, aunque lo de despues no. Y no se integra: la duda cae
    // contra integrar, nunca a favor.
    const b = conVerdicto(APROBADO)
    const { ctx, consultas } = conTestigo(b)
    const revienta = (): boolean => { throw new Error('no se pudo leer el package.json') } // prettier-ignore

    const r = await judgeAndIntegrate(ctx, 'prop-1', { omega: b.deps, autoMerge: NADA, esRepoPropio: revienta }) // prettier-ignore

    expect(r.omega).toMatchObject({ ok: true })
    expect(r.merge).toBeNull()
    expect(consultas()).toBe(1) // miro de quien era; no llego a gatherCase
  })
})
