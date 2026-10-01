import { MOTIVO_HUELLA } from '@domain/repair/motivo-de-la-huella'
import { MOTIVO_WORKTREE } from '@domain/repair/motivo-del-worktree'
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
    // Dos DECISION entre la corrida y la transicion, y su orden dice cuando se
    // supo cada cosa: la HUELLA en cuanto el generador vuelve —antes de que el
    // commit vacie el diff, y por eso tambien existe cuando la corrida falla—, y
    // el SCOPE al medir el diff, que es donde la correa se APLICA (DEUDAS §6.12).
    expect(b.events.map((e) => [e.eventType, e.phase])).toEqual([
      ['DECISION', 'GENERATE'],
      ['AGENT_RUN', 'GENERATE'],
      ['DECISION', 'GENERATE'],
      ['DECISION', 'GENERATE'],
      ['TRANSITION', 'GENERATE']
    ])
    // El PRIMERO tambien lleva su motivo, y faltaba justo esa linea: es el unico
    // asiento con `branch` y `baseSha`, y la firma lo busca POR el motivo. Los
    // dos de abajo se afirmaban porque tenian constante; este era un literal
    // suelto, y por eso pudo desfasarse sin que nada cayera (DEUDAS §13).
    expect(b.events[0].reason).toBe(MOTIVO_WORKTREE)
    expect(b.events[2].reason).toBe(MOTIVO_HUELLA)
    expect(b.events[3].reason).toBe(MOTIVO_CORREA)
    expect(b.events[4].toState).toBe('GENERADO')
    expect(b.calls).toEqual(['create', 'generate', 'commit'])
  })
})
