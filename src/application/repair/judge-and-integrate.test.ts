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

/**
 * `gatherCase` busca el proyecto antes que nada y `runOmega` no lo mira nunca:
 * esa consulta es el rastro que distingue "se planteo integrar" de "no se
 * llego a plantear".
 */
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

describe('judgeAndIntegrate: el veto corta antes de mirar la politica', () => {
  it('vetado: ni se plantea integrar', async () => {
    // Preguntarle a la politica por un fix que el revisor acaba de rechazar
    // ensuciaria el libro con una decision que nadie tenia que tomar.
    const b = conVerdicto(VETADO)
    const { ctx, consultas } = conTestigo(b)

    const result = await judgeAndIntegrate(ctx, 'prop-1', { omega: b.deps, autoMerge: NADA })

    expect(result.omega).toMatchObject({ ok: false })
    expect(result.merge).toBeNull() // no se planteo: no hay nada que contar
    expect(consultas()).toBe(0)
  })

  it('aprobado: la integracion se plantea', async () => {
    const b = conVerdicto(APROBADO)
    const { ctx, consultas } = conTestigo(b)

    const result = await judgeAndIntegrate(ctx, 'prop-1', { omega: b.deps, autoMerge: NADA })

    expect(result.omega).toMatchObject({ ok: true })
    expect(result.merge).not.toBeNull() // se planteo: el informe lo cuenta
    expect(consultas()).toBe(1)
  })

  it('si integrar revienta, el veredicto sale igual', async () => {
    // OMEGA ya juzgo y ya lo asento. El operador tiene derecho a saber que su
    // propuesta paso, aunque el merge no.
    const b = conVerdicto(APROBADO)
    const rota = { readConfig: () => { throw new Error('disco lleno') } } as unknown as AutoMergeDeps // prettier-ignore

    const result = await judgeAndIntegrate(b.context, 'prop-1', { omega: b.deps, autoMerge: rota })

    expect(result.omega).toMatchObject({ ok: true })
    expect(result.merge).toBeNull()
  })
})
