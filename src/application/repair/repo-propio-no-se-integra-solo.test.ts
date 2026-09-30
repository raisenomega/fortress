import { describe, expect, it } from 'vitest'
import { integracionAutomaticaPermitida } from '@domain/repair/integracion-sin-firma'
import type { AutoMergeDeps } from './auto-merge-types'
import { judgeAndIntegrate } from './judge-and-integrate'
import { APROBADO, bench, type Bench } from './run-omega-fixture'

const META = { tokensUsed: 1000, durationMs: 1, startedAt: 1, endedAt: 2 }

/** Cuenta si alguien llego a pedirle a git que tocara el arbol vivo. */
function applier(): { deps: AutoMergeDeps; merges: () => number } {
  let n = 0
  const deps = {
    readConfig: () => ({ kind: 'not-present' }),
    mergeApplier: { apply: () => ((n += 1), Promise.resolve({ ok: true, mergeCommitSha: 'x' })) },
    now: () => 1
  } as unknown as AutoMergeDeps
  return { deps, merges: () => n }
}

function conProyecto(b: Bench, path: string | null): Bench['context'] {
  const project = path === null ? null : { id: 'p1', path, contaminated: false }
  return { ...b.context, projects: { findById: () => project } } as unknown as Bench['context']
}

const aprobado = (): Bench => bench({ result: { ok: true, verdict: APROBADO, runMeta: META, notas: [] } })

describe('el codigo propio no se integra solo, por NINGUNA via', () => {
  it('repo propio: JUZGA, y no se plantea siquiera integrar', async () => {
    // El 22 de agosto tres propuestas entraron en este repositorio por aqui,
    // asentadas como "integracion automatica". El operador habia pedido un
    // juicio; la integracion venia detras, y sin decirlo.
    const b = aprobado()
    const { deps, merges } = applier()

    const r = await judgeAndIntegrate(conProyecto(b, '/fortress'), 'prop-1', { omega: b.deps, autoMerge: deps, esRepoPropio: () => true }) // prettier-ignore

    expect(r.omega).toMatchObject({ ok: true }) // el juicio SI se hizo
    expect(r.merge).toBeNull()
    expect(merges()).toBe(0)
  })

  it('otro proyecto: el flujo de siempre, intacto', async () => {
    const b = aprobado()
    const { deps, merges } = applier()

    const r = await judgeAndIntegrate(conProyecto(b, '/ajeno'), 'prop-1', { omega: b.deps, autoMerge: deps, esRepoPropio: () => false }) // prettier-ignore

    expect(r.omega).toMatchObject({ ok: true })
    expect(r.merge).not.toBeNull() // se planteo, que es lo que cambia
    void merges
  })

  it('un proyecto que no se puede ubicar cuenta como propio', async () => {
    // No saber de quien es el codigo no es permiso para integrarlo solo.
    const b = aprobado()
    const { deps, merges } = applier()

    const r = await judgeAndIntegrate(conProyecto(b, null), 'prop-1', { omega: b.deps, autoMerge: deps, esRepoPropio: () => false }) // prettier-ignore

    expect(r.merge).toBeNull()
    expect(merges()).toBe(0)
  })
})

describe('la garantia, en el dominio', () => {
  it('la puerta automatica no vale sobre el repo propio, y si sobre el resto', () => {
    expect(integracionAutomaticaPermitida(true)).toBe(false)
    expect(integracionAutomaticaPermitida(false)).toBe(true)
  })
})
