import { describe, expect, it } from 'vitest'
import type { AppContext } from '@application/context'
import { LOOP_SELF_REPO_BLOCK } from '@domain/loop/loop-gate'
import { loopRepair } from './loop-repair-op'

/** Contexto minimo: la guarda debe cortar ANTES de tocar nada mas. */
function contextWith(project: { path: string; trusted: boolean }): AppContext {
  return { projects: { findById: () => ({ id: 'p1', ...project }) } } as unknown as AppContext
}

const silencio = (): void => undefined

describe('loopRepair (gate del arbol a editar)', () => {
  it('RECHAZA el propio repo de FORTRESS aunque sea de confianza', async () => {
    // process.cwd() en vitest es la raiz de este repo: isFortressRepo lo
    // reconoce de verdad, leyendo el package.json real. Sin mocks.
    const context = contextWith({ path: process.cwd(), trusted: true })

    const result = await loopRepair(context, 'p1', silencio)

    expect(result.ok ? null : result.error).toBe(LOOP_SELF_REPO_BLOCK)
  })

  it('rechaza un proyecto sin confianza antes de reservar turno', async () => {
    const context = contextWith({ path: '/tmp/repo-ajeno', trusted: false })

    const result = await loopRepair(context, 'p1', silencio)

    expect(result.ok).toBe(false)
    expect(result.ok ? '' : result.error).toMatch(/confianza/)
  })
})
