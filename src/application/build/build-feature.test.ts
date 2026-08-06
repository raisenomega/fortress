import { describe, expect, it } from 'vitest'
import { buildFeature } from './build-feature'
import { agentOf, ctx, deps, reply } from './build-feature-fixtures'

describe('buildFeature', () => {
  it('construye y NO revierte si todo pasa', async () => {
    const d = deps()
    const r = await buildFeature(ctx(true), 'p1', 'i', 'plan', agentOf(reply({})), d, () => {})
    expect(r.ok).toBe(true)
    expect(d.reverted).toHaveLength(0)
  })

  it('revierte si el agente falla', async () => {
    const d = deps()
    const r = await buildFeature(
      ctx(true),
      'p1',
      'i',
      'p',
      agentOf(reply({ failed: true })),
      d,
      () => {}
    )
    expect(r.ok).toBe(false)
    expect(d.reverted).toEqual(['ref1'])
  })

  it('revierte si la verificacion queda en rojo', async () => {
    const d = deps({ verify: () => Promise.resolve(false) })
    const r = await buildFeature(ctx(true), 'p1', 'i', 'p', agentOf(reply({})), d, () => {})
    expect(r.ok).toBe(false)
    expect(d.reverted).toEqual(['ref1'])
  })

  it('exige proyecto de confianza', async () => {
    expect(
      (await buildFeature(ctx(false), 'p1', 'i', 'p', agentOf(reply({})), deps(), () => {})).ok
    ).toBe(false)
  })

  it('exige repo git (snapshot no nulo)', async () => {
    const d = deps({ snapshot: () => null })
    expect(
      (await buildFeature(ctx(true), 'p1', 'i', 'p', agentOf(reply({})), d, () => {})).ok
    ).toBe(false)
  })
})
