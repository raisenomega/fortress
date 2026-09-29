import { MOTIVO_CORREA } from '@domain/repair/lo-que-el-motor-supo'
import { describe, expect, it } from 'vitest'
import { bench } from './generate-fix-fixture'
import { generateFix } from './generate-fix'

/**
 * El camino feliz sale a su fichero porque su hermano llego al tope al crecer la
 * cadena de eventos con el asiento de la correa (DEUDAS §6.12).
 */
describe('generateFix (C3), camino feliz', () => {
  it('camino feliz: GENERADO con WORKTREE_CREATE + AGENT_RUN + SCOPE + TRANSITION', async () => {
    const b = bench()
    const result = await generateFix(b.context, 'prop-1', b.deps)

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.commitSha).toBe('c'.repeat(40))
    expect(b.patches.at(-1)).toMatchObject({ state: 'GENERADO' })
    // El SCOPE es nuevo (DEUDAS §6.12): la correa que se APLICA queda asentada
    // para que el revisor la lea del libro en vez de recalcularla. Va entre la
    // corrida y la transicion porque se asienta donde se aplica, al medir el diff.
    expect(b.events.map((e) => [e.eventType, e.phase])).toEqual([
      ['DECISION', 'GENERATE'],
      ['AGENT_RUN', 'GENERATE'],
      ['DECISION', 'GENERATE'],
      ['TRANSITION', 'GENERATE']
    ])
    expect(b.events[2].reason).toBe(MOTIVO_CORREA)
    expect(b.events[3].toState).toBe('GENERADO')
    expect(b.calls).toEqual(['create', 'generate', 'commit'])
  })
})
